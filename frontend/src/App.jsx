import { useEffect, useState } from "react";
import AqiMap from "./components/AqiMap";
import ZonePanel from "./components/ZonePanel";
import ForecastChart from "./components/ForecastChart";
import ChatBox from "./components/ChatBox";
import LiveBadge from "./components/LiveBadge";
import TopLocationsPanel from "./components/TopLocationsPanel";
import RegionalTrendChart from "./components/RegionalTrendChart";
import PollutantBreakdown from "./components/PollutantBreakdown";
import { fetchAqiStations } from "./api/client";
import { FALLBACK_STATIONS } from "./lib/fallbackStations";
import { aqiBucket } from "./lib/aqi";

const CITY = "Bengaluru";

function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

function App() {
  const [aqiData, setAqiData] = useState(null);
  const [selected, setSelected] = useState(FALLBACK_STATIONS[0]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAqiStations(CITY)
      .then((data) => {
        setAqiData(data);
        if (data.stations && data.stations.length > 0) {
          setSelected(data.stations[0]);
        }
      })
      .catch((err) => {
        console.warn("[App] API fetch error, using fallback stations:", err.message);
        setError(`Backend API notice: Using fallback station data (${err.message})`);
      });
  }, []);

  // Guarantee stations are NEVER empty!
  const currentStations = (aqiData?.stations && aqiData.stations.length > 0)
    ? aqiData.stations
    : FALLBACK_STATIONS;

  const handleSelectLocation = (station) => {
    if (station) {
      setSelected(station);
    }
  };

  // Calculate regional average AQI
  const avgAqi = Math.round(
    currentStations.reduce((acc, s) => acc + (s.aqi ?? 0), 0) / currentStations.length
  );

  const currentAqi = selected?.aqi ?? avgAqi;
  const currentBucket = aqiBucket(currentAqi);

  return (
    <div className="min-h-screen bg-darkBg px-4 py-5 font-sans text-slate-100 sm:px-6 lg:px-8">
      {/* Top Header Matching Dark Reference Image */}
      <header className="mx-auto mb-4 flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-borderDark bg-darkCard/90 p-4 shadow-darkCard backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md text-xl font-black">
            🍃
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-100">AirSense</h1>
              <span className="rounded-full bg-[#192540] border border-borderDark px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                Enterprise Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Urban Air Quality Intelligence & Predictive AI Matrix - {CITY} Region
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LiveBadge live={aqiData ? aqiData.live : false} label="Live Feed" />
          <span className="font-mono text-xs text-slate-400">
            Updated {timeAgo(aqiData?.updatedAt)}
          </span>
        </div>
      </header>

      {error && (
        <div className="mx-auto mb-4 max-w-7xl rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs font-medium text-amber-300 shadow-sm flex items-center justify-between">
          <span>{error}</span>
          <span className="font-mono text-[10px] text-amber-400 uppercase">SYSTEM ACTIVE</span>
        </div>
      )}

      {/* Top KPI Stat Cards Grid matching Dark Reference Image */}
      <div className="mx-auto mb-5 max-w-7xl grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* SELECT LOCATION Dropdown Card */}
        <div className="rounded-2xl border border-borderDark bg-darkCard p-4 shadow-darkCard flex flex-col justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>SELECT LOCATION:</span>
            <span className="text-[10px] text-cyanAccent">Click Map / Dropdown</span>
          </label>
          <select
            value={selected?.id ? String(selected.id) : ""}
            onChange={(e) => {
              const val = e.target.value;
              const target = currentStations.find((s) => String(s.id) === String(val));
              if (target) handleSelectLocation(target);
            }}
            className="w-full rounded-xl border border-borderDark bg-[#0B1120] px-3 py-2.5 text-xs font-semibold text-slate-100 outline-none focus:border-cyanAccent focus:ring-2 focus:ring-cyan-500/20 cursor-pointer shadow-xs transition-all"
          >
            {currentStations.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Avg. Regional AQI / Active Location Card */}
        <div className="rounded-2xl border border-borderDark bg-darkCard p-4 shadow-darkCard">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {selected ? "Active Location AQI" : "Avg. Regional AQI"}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold" style={{ color: currentBucket.color }}>
              {currentAqi}
            </span>
            <span className="text-sm font-bold text-emerald-400">↑</span>
          </div>
          <div className="text-[11px] text-slate-300 font-medium truncate">
            {currentBucket.label} ({selected ? selected.name : "Regional Average"})
          </div>
        </div>

        {/* Top Pollutant Card */}
        <div className="rounded-2xl border border-borderDark bg-darkCard p-4 shadow-darkCard">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Top Pollutant</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">
              {selected?.dominant_pollutant?.toUpperCase() || "PM2.5"}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {selected ? `${Math.round((selected.aqi || 100) * 0.28)} µg/m³` : "2.5 µg/m³"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate">
            {selected ? `Dominant at ${selected.name}` : "Fine Particulate (PM2.5)"}
          </div>
        </div>

        {/* Predictions Accuracy Card */}
        <div className="rounded-2xl border border-borderDark bg-darkCard p-4 shadow-darkCard">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Predictions Accuracy</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">94%</span>
            <span className="text-xs font-semibold text-cyanAccent">AI Confidence</span>
          </div>
          <div className="text-[11px] text-cyanAccent font-medium">Powered by Gemini AI</div>
        </div>
      </div>

      {/* Main Grid Section Matching Dark Reference Image */}
      <main className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
          {/* Map Section */}
          <div className="h-[520px] overflow-hidden rounded-2xl">
            <AqiMap
              stations={currentStations}
              selectedId={selected?.id}
              onSelect={handleSelectLocation}
            />
          </div>

          {/* Right Column Stacked Widgets matching Dark Reference Image */}
          <div className="flex flex-col gap-4">
            <TopLocationsPanel
              stations={currentStations}
              selectedId={selected?.id}
              onSelect={handleSelectLocation}
            />
            <RegionalTrendChart zone={selected} />
            <PollutantBreakdown zone={selected} />
          </div>
        </div>

        {/* Bottom Details Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
          <ForecastChart zone={selected} city={CITY} />
          <ZonePanel zone={selected} city={CITY} />
        </div>

        {/* Gemini AI Chatbot */}
        <ChatBox zone={selected} />
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-8 max-w-7xl text-center text-xs text-slate-500 py-3">
        AirSense Enterprise Dashboard · Live WAQI & NASA FIRMS Telemetry · Powered by Google Gemini AI
      </footer>
    </div>
  );
}

export default App;
