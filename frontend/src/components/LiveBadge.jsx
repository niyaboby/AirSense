export default function LiveBadge({ live, label, engine, model }) {
  if (engine === "gemini" || live) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 shadow-sm"
        title="Powered by live Gemini AI"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
        </span>
        {engine === "gemini" ? `Gemini AI (${model || "Flash"})` : "Live Feed"}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
      title="Using cached / fallback data"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {label || "Cached Data"}
    </span>
  );
}
