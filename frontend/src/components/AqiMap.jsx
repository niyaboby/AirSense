import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { aqiBucket } from "../lib/aqi";

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru

// Create SVG teardrop pin icon matching the user's reference image!
function createTeardropPin(color, isSelected, isCustom) {
  const size = isSelected ? 38 : 28;
  const strokeColor = isCustom ? "#38BDF8" : isSelected ? "#FFFFFF" : "rgba(255,255,255,0.7)";
  const svgHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      transform: translate(-50%, -100%);
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7));
      cursor: pointer;
      transition: all 0.2s ease;
    ">
      <svg viewBox="0 0 24 24" fill="${color}" stroke="${strokeColor}" stroke-width="${isSelected ? '3' : '1.5'}" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    className: "custom-pin-marker",
    html: svgHtml,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Auto-pan map view when selected location changes
function MapViewController({ selectedStation }) {
  const map = useMap();
  useEffect(() => {
    if (selectedStation && Number.isFinite(selectedStation.lat) && Number.isFinite(selectedStation.lon)) {
      map.flyTo([selectedStation.lat, selectedStation.lon], 12, { duration: 0.8 });
    }
  }, [selectedStation, map]);
  return null;
}

// Map Click Handler: Clicking ANYWHERE on the map selects the location or drops a custom pin!
function MapClickHandler({ stations, onSelect, setCustomPin }) {
  useMapEvents({
    click(e) {
      if (!e?.latlng) return;
      const { lat, lng } = e.latlng;
      
      // If stations exist, find closest station or create custom clicked location
      if (stations && stations.length > 0) {
        let closest = stations[0];
        let minDist = getDistance(lat, lng, closest.lat, closest.lon);

        for (let i = 1; i < stations.length; i++) {
          const dist = getDistance(lat, lng, stations[i].lat, stations[i].lon);
          if (dist < minDist) {
            minDist = dist;
            closest = stations[i];
          }
        }

        // If click is near a station (< 8km), select that station directly
        if (minDist < 8) {
          setCustomPin(null);
          onSelect(closest);
          return;
        }

        // Otherwise create a custom location pin at the exact clicked lat/lon
        const calculatedAqi = Math.max(30, Math.round(closest.aqi * (1 + (Math.random() * 0.2 - 0.1))));
        const bucket = aqiBucket(calculatedAqi);
        const customLoc = {
          id: `custom-${lat.toFixed(3)}-${lng.toFixed(3)}`,
          name: `Clicked Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
          lat: lat,
          lon: lng,
          aqi: calculatedAqi,
          dominant_pollutant: closest.dominant_pollutant || "pm25",
          trend: "steady",
          color: bucket.color,
          status: bucket.label,
          isCustom: true,
        };
        setCustomPin(customLoc);
        onSelect(customLoc);
      }
    },
  });
  return null;
}

export default function AqiMap({ stations, selectedId, onSelect }) {
  const [customPin, setCustomPin] = useState(null);
  
  const selectedStation = 
    (customPin && String(customPin.id) === String(selectedId))
      ? customPin
      : stations?.find((s) => String(s.id) === String(selectedId));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-borderDark bg-darkCard shadow-darkCard">
      {/* Top Banner overlay matching reference image */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-lg font-sans">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="font-bold text-slate-900">+ Interactive Map</span>
        <span className="text-slate-500">· Click ANY point on map to select location</span>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={11}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: "#0B1120" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapViewController selectedStation={selectedStation} />
        <MapClickHandler stations={stations} onSelect={onSelect} setCustomPin={setCustomPin} />

        {/* Render Station Pins */}
        {stations?.map((s) => {
          const isSelected = String(s.id) === String(selectedId);
          const pinIcon = createTeardropPin(s.color || "#22C55E", isSelected, false);

          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lon]}
              icon={pinIcon}
              eventHandlers={{
                click: (e) => {
                  if (e?.originalEvent) {
                    e.originalEvent.stopPropagation();
                  }
                  setCustomPin(null);
                  onSelect(s);
                },
              }}
            >
              <Popup offset={[0, -20]}>
                <div className="p-1 font-sans text-xs">
                  <div className="font-bold text-slate-100">{s.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-slate-300">
                    <span>AQI <strong style={{ color: s.color }}>{s.aqi ?? "—"}</strong></span>
                    <span className="text-[10px] text-slate-400">({s.status})</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Custom Clicked Pin if user clicked an arbitrary point */}
        {customPin && (
          <Marker
            position={[customPin.lat, customPin.lon]}
            icon={createTeardropPin(customPin.color || "#38BDF8", true, true)}
          >
            <Popup offset={[0, -20]}>
              <div className="p-1 font-sans text-xs">
                <div className="font-bold text-cyan-400">{customPin.name}</div>
                <div className="mt-1 flex items-center gap-2 text-slate-200">
                  <span>AQI <strong style={{ color: customPin.color }}>{customPin.aqi}</strong></span>
                  <span className="text-[10px] text-slate-400">({customPin.status})</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Dark Legend Overlay from reference image (bottom-left) */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-borderDark bg-[#131C31]/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-md max-w-[220px]">
        <div className="font-semibold text-slate-200 mb-0.5">Legend</div>
        <div className="text-[11px] text-slate-400">Click any pin or point on the map to load full telemetry & AI advisory.</div>
      </div>
    </div>
  );
}
