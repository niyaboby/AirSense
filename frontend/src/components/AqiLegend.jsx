import { AQI_SCALE } from "../lib/aqi";

export default function AqiLegend() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-xs">
      <div className="mb-2 flex items-center justify-between font-medium text-slate-500 text-[11px]">
        <span className="flex items-center gap-1.5 text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> AQI Scale Legend
        </span>
        <span className="text-slate-400">0 – 500+ Scale</span>
      </div>
      <div className="flex items-center gap-1">
        {AQI_SCALE.map((band, i) => (
          <div key={band.label} className="group relative flex flex-1 flex-col items-center gap-1">
            <div
              className="h-2 w-full transition-transform duration-200 group-hover:scale-y-125"
              style={{
                backgroundColor: band.color,
                borderRadius: i === 0 ? "4px 0 0 4px" : i === AQI_SCALE.length - 1 ? "0 4px 4px 0" : "0",
              }}
            />
            <div className="flex flex-col items-center">
              <span className="font-semibold text-slate-800 text-[11px]">
                {band.label}
              </span>
              <span className="text-[10px] text-slate-500">
                {i === 0 ? "0" : AQI_SCALE[i - 1].max + 1}
                {band.max === Infinity ? "+" : `–${band.max}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
