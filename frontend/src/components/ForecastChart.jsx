import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { fetchForecast } from "../api/client";
import { aqiBucket } from "../lib/aqi";
import LiveBadge from "./LiveBadge";

function formatHour(offset) {
  if (offset === 0) return "Now";
  const days = Math.floor(offset / 24);
  const rem = offset % 24;
  if (rem === 0) return `+${days}d`;
  return `+${offset}h`;
}

export default function ForecastChart({ zone, city }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!zone) return;
    setLoading(true);
    setError(null);
    fetchForecast({ lat: zone.lat, lon: zone.lon, city, aqi: zone.aqi })
      .then(setForecast)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [zone, city]);

  return (
    <div className="rounded-2xl border border-borderDark bg-darkCard p-5 shadow-darkCard">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-borderDark pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100">
            72-Hour AQI Forecast {zone ? `— ${zone.name}` : ""}
          </h3>
          <p className="text-xs text-slate-400">
            Wind speed & humidity-adjusted predictive dispersion forecast.
          </p>
        </div>
        {forecast && <LiveBadge live={forecast.live} label="Open-Meteo Feed" />}
      </div>

      {!zone && (
        <div className="py-12 text-center text-xs text-slate-400">
          Select a location on the map to load its 72-hour forecast trajectory.
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-cyanAccent animate-pulse font-mono">
          <span className="h-4 w-4 rounded-full border-2 border-cyanAccent border-t-transparent animate-spin" />
          Loading forecast data...
        </div>
      )}
      {error && <p className="py-4 text-xs font-medium text-rose-400">Error loading forecast: {error}</p>}

      {forecast && !loading && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={forecast.points} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#263554" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="hour_offset"
              tickFormatter={formatHour}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#263554" }}
            />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={36} />
            <ReferenceLine y={100} stroke="#EAB308" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Tooltip content={<ForecastTooltip />} />
            <Line
              type="monotone"
              dataKey="aqi"
              stroke="#38BDF8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#38BDF8" }}
              activeDot={{ r: 6, fill: "#38BDF8", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const bucket = aqiBucket(point.aqi);
  return (
    <div className="rounded-lg border border-borderDark bg-[#131C31] p-3 text-xs shadow-xl text-slate-100 font-sans">
      <div className="font-semibold text-slate-400">{formatHour(label)}</div>
      <div style={{ color: bucket.color }} className="mt-0.5 font-bold text-sm">
        AQI {point.aqi} · {bucket.label}
      </div>
      <div className="mt-1 space-y-0.5 text-[11px] text-slate-400">
        <div>Wind Speed: {point.wind_speed_10m} km/h</div>
        <div>Humidity: {point.relative_humidity_2m}%</div>
      </div>
    </div>
  );
}
