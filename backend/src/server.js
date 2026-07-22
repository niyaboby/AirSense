import "dotenv/config";
import express from "express";
import cors from "cors";

import aqiRoutes from "./routes/aqi.js";
import forecastRoutes from "./routes/forecast.js";
import attributionRoutes from "./routes/attribution.js";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 8787;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasWaqiToken: Boolean(process.env.WAQI_TOKEN),
    hasFirmsKey: Boolean(process.env.FIRMS_MAP_KEY),
    hasClaudeKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.use("/api/aqi", aqiRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/attribution", attributionRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`AirSense backend listening on http://localhost:${PORT}`);
  if (process.env.GEMINI_API_KEY) console.log("  ★ GEMINI_API_KEY active: AI threat attribution & chat powered by Google Gemini.");
  if (!process.env.WAQI_TOKEN) console.log("  → No WAQI_TOKEN set: AQI map will use mock station data.");
  if (!process.env.FIRMS_MAP_KEY) console.log("  → No FIRMS_MAP_KEY set: fire hotspots will use mock data.");
});
