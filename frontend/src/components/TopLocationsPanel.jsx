import { aqiBucket } from "../lib/aqi";

export default function TopLocationsPanel({ stations, selectedId, onSelect }) {
  if (!stations || stations.length === 0) return null;

  // Top 5 stations by AQI or location ranking
  const sorted = [...stations].sort((a, b) => (b.aqi ?? 0) - (a.aqi ?? 0)).slice(0, 5);
  const maxAqi = Math.max(...sorted.map((s) => s.aqi ?? 1), 100);

  return (
    <div className="rounded-2xl border border-borderDark bg-darkCard p-4 shadow-darkCard">
      <div className="mb-3">
        <h3 className="text-xs font-bold text-slate-100">Top 5 Locations</h3>
        <p className="text-[11px] text-slate-400">AQI ranking of stations</p>
      </div>

      <div className="space-y-2">
        {sorted.map((s, idx) => {
          const isSelected = s.id === selectedId;
          const bucket = aqiBucket(s.aqi);
          const percent = Math.min(100, Math.max(15, ((s.aqi ?? 0) / maxAqi) * 100));

          return (
            <div
              key={s.id}
              onClick={() => onSelect(s)}
              className={`group flex items-center justify-between gap-2 rounded-xl p-1.5 transition-all cursor-pointer ${
                isSelected ? "bg-[#1C2A48] ring-1 ring-cyanAccent/50" : "hover:bg-[#192540]"
              }`}
            >
              <div className="flex items-center gap-2 text-xs truncate max-w-[160px]">
                <span className="text-[11px] font-semibold text-slate-400 w-3">{idx + 1}</span>
                <span className="truncate font-medium text-slate-200 text-[11px]">{s.name}</span>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                <div className="h-4.5 w-full overflow-hidden rounded-md bg-[#0B1120] relative">
                  <div
                    className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-1 text.10px font-bold text-slate-900 shadow-xs"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: bucket.color,
                    }}
                  >
                    <span className="text-[9px] drop-shadow font-mono">{s.aqi}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
