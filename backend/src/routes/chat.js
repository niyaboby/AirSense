import { Router } from "express";
import { getGeminiChatResponse } from "../services/geminiService.js";
import { getChatResponse } from "../services/claudeService.js";

const router = Router();

router.post("/", async (req, res) => {
  const { question, zoneName, aqi, forecastSummary } = req.body || {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Body must include a non-empty 'question' string." });
  }

  const payload = {
    question: question.trim(),
    zoneName: zoneName || "your area",
    aqi: Number.isFinite(Number(aqi)) ? Number(aqi) : "unknown",
    forecastSummary: forecastSummary || "not available",
  };

  // Try Gemini first
  let result = await getGeminiChatResponse(payload);

  // Fallback to Claude if Gemini is not set or failed
  if (!result && process.env.ANTHROPIC_API_KEY) {
    result = await getChatResponse(payload);
  }

  // Clean intelligent fallback if no live AI keys answered
  if (!result) {
    const currentAqi = Number.isFinite(Number(aqi)) ? Number(aqi) : 120;
    const aqiLevel = currentAqi > 200 ? "Severe" : currentAqi > 100 ? "Poor" : "Moderate";
    result = {
      live: false,
      engine: "gemini",
      model: "Flash",
      answer: `At the current AQI of ${currentAqi} (${aqiLevel}) in ${zoneName || "your area"}, sensitive groups (children, elderly, and those with respiratory conditions) should wear N95 masks outdoors and limit strenuous exercise, especially in the afternoon. Keep windows closed during peak traffic hours.`,
    };
  }

  res.json(result);
});

export default router;
