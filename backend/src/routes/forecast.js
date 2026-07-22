import { Router } from "express";
import { getWeatherForecast } from "../services/openMeteoService.js";
import { computeForecast } from "../services/forecastService.js";

const router = Router();

router.get("/", async (req, res) => {
  const { lat, lon, city, aqi } = req.query;
  const currentAqi = Number(aqi);

  if (!Number.isFinite(currentAqi)) {
    return res.status(400).json({ error: "Query param 'aqi' (current AQI, number) is required." });
  }

  const { live, data } = await getWeatherForecast({
    lat: Number(lat),
    lon: Number(lon),
    city: city || "Bengaluru",
  });

  const forecast = computeForecast({ currentAqi, hourly: data.hourly });

  res.json({
    live,
    city: data.city,
    ...forecast,
  });
});

export default router;
