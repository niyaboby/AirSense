import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function PollutantBreakdown({ zone }) {
  const pollutantData = [
    { name: "PALSS", value: zone?.aqi ? Math.round(zone.aqi * 8.2) : 740, color: "#22C55E" },
    { name: "MM10", value: zone?.aqi ? Math.round(zone.aqi * 5.8) : 510, color: "#EAB308" },
    { name: "NO2", value: zone?.aqi ? Math.round(zone.aqi * 7.4) : 710, color: "#F97316" },
    { name: "O3", value: zone?.aqi ? Math.round(zone.aqi * 4.2) : 380, color: "#38BDF8" },
  ];

  return (
    <div className="rounded-2xl border border-borderDark bg-darkCard p-4 shadow-darkCard">
      <div className="mb-2">
        <h3 className="text-xs font-bold text-slate-100">Pollutant Breakdown</h3>
        <p className="text-[11px] text-slate-400">Concentration breakdown across key pollutants</p>
      </div>

      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pollutantData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={24}>
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={{ stroke: "#263554" }} />
            <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-md border border-borderDark bg-[#131C31] p-1.5 text-[10px] shadow-lg text-slate-100 font-sans">
                      <span className="font-semibold text-slate-300">{payload[0].payload.name}: </span>
                      <span className="font-bold text-cyanAccent">{payload[0].value} µg/m³</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {pollutantData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
