import { useState, useRef, useEffect } from "react";
import { askChat } from "../api/client";
import LiveBadge from "./LiveBadge";

const SUGGESTED_QUERIES = [
  "Should sensitive groups wear N95 masks outdoor today?",
  "Is morning jogging safe with the current AQI level?",
  "ಕನ್ನಡ: ಹೊರಗೆ ಹೋಗುವಾಗ ಯಾವ ಮುನ್ನೆಚ್ಚರಿಕೆ ಬೇಕು?",
  "हिन्दी: क्या बच्चों को पार्क में खेलने भेजना सुरक्षित है?",
];

export default function ChatBox({ zone }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your Gemini AirSense AI assistant. Ask me anything about health precautions, mask recommendations, or outdoor activity advice for your area (English, हिन्दी, ಕನ್ನಡ, etc.).",
      live: true,
      engine: "gemini",
      model: "Flash",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e, customPrompt) {
    if (e) e.preventDefault();
    const textToSend = (customPrompt || question).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const result = await askChat({
        question: textToSend,
        zoneName: zone?.name,
        aqi: zone?.aqi,
        forecastSummary: zone ? `currently ${zone.aqi} AQI, trend ${zone.trend || "steady"}` : undefined,
      });

      const aiMsg = {
        sender: "ai",
        text: result.answer,
        live: result.live,
        engine: result.engine,
        model: result.model,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[480px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm">
            ✨
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              Gemini AI Health Advisor
            </h3>
            <p className="text-xs text-slate-500">
              Multilingual real-time air quality & health advisory assistant
            </p>
          </div>
        </div>
        <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          Google Gemini Powered
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
              <span>{msg.sender === "user" ? "You" : "Gemini AI"}</span>
              <span>•</span>
              <span>{msg.time}</span>
            </div>

            <div
              className={`max-w-[82%] text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm font-medium"
                  : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                    ✦ Health Guidance {zone ? `(${zone.name})` : ""}
                  </span>
                  <LiveBadge live={msg.live} engine={msg.engine} model={msg.model} />
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[200px] shadow-sm">
            <span className="h-3 w-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            Gemini is thinking...
          </div>
        )}

        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
            Couldn't get a response: {error}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Chips */}
      <div className="border-t border-slate-100 bg-white px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Suggestions:
        </span>
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(null, q)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            zone
              ? `Ask about air quality & health in ${zone.name}…`
              : "Ask about air quality precautions in your area…"
          }
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-40 transition-all"
        >
          Send
        </button>
      </form>
    </div>
  );
}
