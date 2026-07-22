import { useEffect, useState } from "react";
import { aqiBucket } from "../lib/aqi";
import { fetchAttribution } from "../api/client";
import LiveBadge from "./LiveBadge";

const POLLUTANT_LABELS = {
  pm25: "PM2.5 Fine Particles",
  pm10: "PM10 Coarse Particles",
  no2: "Nitrogen Dioxide (NO₂)",
  o3: "Ground Ozone (O₃)",
  so2: "Sulfur Dioxide (SO₂)",
  co: "Carbon Monoxide (CO)",
};

export default function ZonePanel({ zone, city }) {
  const [attribution, setAttribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!zone) return;
    setLoading(true);
    setError(null);
    setAttribution(null);
    fetchAttribution({
      zoneName: zone.name,
      lat: zone.lat,
      lon: zone.lon,
      aqi: zone.aqi,
      trend: zone.trend,
      dominantPollutant: zone.dominant_pollutant,
      city,
    })
      .then(setAttribution)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [zone, city]);

  if (!zone) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-borderDark bg-darkCard p-6 text-center shadow-darkCard">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#192540] text-2xl text-cyanAccent">
          📍
        </div>
        <p className="font-semibold text-slate-100 text-sm">Select a Location</p>
        <p className="mt-1 text-xs text-slate-400 max-w-xs">
          Click any pin on the map or select from the dropdown to inspect local AQI and AI source attribution.
        </p>
      </div>
    );
  }

  const bucket = aqiBucket(zone.aqi);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-borderDark bg-darkCard p-5 shadow-darkCard">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-borderDark pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">{zone.name}</h2>
            <span className="rounded-md bg-[#192540] px-2 py-0.5 text-xs text-slate-400 font-mono">
              {zone.lat.toFixed(3)}°, {zone.lon.toFixed(3)}°
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Primary Pollutant: <strong className="text-cyanAccent">{POLLUTANT_LABELS[zone.dominant_pollutant] || "PM2.5"}</strong>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Trend</span>
          <div className="text-xs font-semibold text-cyanAccent capitalize">
            {zone.trend === "rising" ? "▲ Rising" : zone.trend === "falling" ? "▼ Falling" : "► Steady"}
          </div>
        </div>
      </div>

      {/* Main AQI Badge Card */}
      <div className="rounded-xl border border-borderDark bg-[#192540]/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Live AQI Score</span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold tracking-tight" style={{ color: bucket.color }}>
                {zone.aqi ?? "—"}
              </span>
              <span
                className="rounded-full px-3 py-0.5 text-xs font-semibold text-slate-900 shadow-xs"
                style={{ backgroundColor: bucket.color }}
              >
                {bucket.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Source Attribution */}
      <div className="pt-1">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            AI Pollution Source Attribution
          </h3>
          {attribution && (
            <LiveBadge
              live={attribution.live}
              engine={attribution.engine}
              model={attribution.model}
            />
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-4 text-xs text-cyanAccent animate-pulse font-mono">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-cyanAccent border-t-transparent animate-spin" />
            Analyzing environmental signals via Gemini AI...
          </div>
        )}

        {error && <p className="text-xs text-rose-400 font-medium">Couldn't load attribution: {error}</p>}

        {attribution && !loading && (
          <div className="space-y-3">
            <SourceBar label={attribution.primary_source} confidence={attribution.primary_confidence} isPrimary />
            {attribution.secondary_source && (
              <SourceBar label={attribution.secondary_source} confidence={attribution.secondary_confidence} />
            )}
            <div className="rounded-xl border border-borderDark bg-[#192540]/70 p-3">
              <p className="text-xs leading-relaxed text-slate-200">{attribution.reasoning}</p>
              <p className="mt-1 text-[10px] text-cyanAccent">
                Inferred via Gemini AI over wind direction, satellite hotspot proximity & diurnal cycles.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceBar({ label, confidence, isPrimary }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={`capitalize font-medium ${isPrimary ? "text-cyanAccent" : "text-slate-300"}`}>
          {isPrimary ? "★ " : "↳ "}{label}
        </span>
        <span className="font-mono text-slate-400">{confidence}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#0B1120] border border-borderDark">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPrimary ? "bg-cyanAccent" : "bg-slate-500"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
        />
      </div>
    </div>
  );
}
