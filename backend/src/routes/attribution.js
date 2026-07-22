import { Router } from "express";
import { getWeatherForecast } from "../services/openMeteoService.js";
import { getFireHotspots } from "../services/firmsService.js";
import { getGeminiAttribution } from "../services/geminiService.js";
import { getSourceAttribution } from "../services/claudeService.js";
import { currentTimeOfDay, currentSeason } from "../services/aqiUtils.js";

const router = Router();

router.post("/", async (req, res) => {
  const { zoneName, lat, lon, aqi, trend, dominantPollutant, city } = req.body || {};

  if (!zoneName || !Number.isFinite(Number(aqi))) {
    return res.status(400).json({ error: "Body must include 'zoneName' and numeric 'aqi'." });
  }

  const [{ live: weatherLive, data: weather }, { live: firmsLive, data: firms }] = await Promise.all([
    getWeatherForecast({ lat: Number(lat), lon: Number(lon), city: city || "Bengaluru" }),
    getFireHotspots({ lat: Number(lat), lon: Number(lon), city: city || "Bengaluru" }),
  ]);

  const currentWind = weather.hourly.wind_speed_10m?.[0] ?? null;
  const currentWindDir = weather.hourly.wind_direction_10m?.[0] ?? null;

  const payload = {
    zoneName,
    aqi: Number(aqi),
    trend: trend || "steady",
    dominantPollutant,
    timeOfDay: currentTimeOfDay(),
    season: currentSeason(),
    windSpeed: currentWind,
    windDirection: currentWindDir,
    fireHotspotCount: firms.hotspots.length,
  };

  // Try Gemini first if key available
  let attribution = await getGeminiAttribution(payload);

  // Fallback to Claude or Mock if Gemini is not set or failed
  if (!attribution) {
    attribution = await getSourceAttribution(payload);
  }

  res.json({
    ...attribution,
    inputsLive: { weather: weatherLive, firms: firmsLive },
  });
});

export default router;
