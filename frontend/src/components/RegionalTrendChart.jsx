import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export default function RegionalTrendChart({ zone }) {
  // Generate 24-hour trend line based on selected location
  const baseAqi = zone?.aqi ?? 78;
  const mockTrendData = [
    { time: "00:00", aqi: Math.max(15, baseAqi - 14) },
    { time: "03:00", aqi: Math.max(15, baseAqi - 6) },
    { time: "06:00", aqi: Math.max(15, baseAqi + 10) },
    { time: "09:00", aqi: Math.max(15, baseAqi + 22) },
    { time: "12:00", aqi: Math.max(15, baseAqi + 4) },
    { time: "15:00", aqi: Math.max(15, baseAqi - 12) },
    { time: "18:00", aqi: Math.max(15, baseAqi + 16) },
    { time: "21:00", aqi: Math.max(15, baseAqi + 1) },
  ];

  return (
    <div className="rounded-2xl border border-borderDark bg-darkCard p-4 shadow-darkCard">
      <div className="mb-2">
        <h3 className="text-xs font-bold text-slate-100">Regional AQI Trend</h3>
        <p className="text-[11px] text-slate-400">Last 24 hours (Last 24 hours)</p>
      </div>

      <div className="h-[95px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockTrendData} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="cyanTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-md border border-borderDark bg-[#131C31] p-1.5 text-[10px] font-sans shadow-lg text-slate-100">
                      <span className="font-semibold text-slate-300">{payload[0].payload.time}: </span>
                      <span className="font-bold text-cyanAccent">{payload[0].value} AQI</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="aqi" stroke="#38BDF8" strokeWidth={2} fill="url(#cyanTrendGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
