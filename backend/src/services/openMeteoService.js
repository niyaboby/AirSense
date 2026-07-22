import fetch from "node-fetch";
import { cacheGet, cacheSet } from "./cache.js";
import { loadMock } from "./mockData.js";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — weather forecasts don't change fast

/**
 * Fetch hourly wind/humidity/temperature forecast for the next 72h at a point.
 * Open-Meteo requires no API key.
 *
 * @param {object} opts
 * @param {number} opts.lat
 * @param {number} opts.lon
 * @param {string} opts.city - used only for mock fallback selection
 * @returns {Promise<{ live: boolean, data: object }>}
 */
export async function getWeatherForecast({ lat, lon, city = "Bengaluru" } = {}) {
  const cacheKey = `openmeteo:${lat},${lon}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    try {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        hourly: "wind_speed_10m,wind_direction_10m,relative_humidity_2m,temperature_2m",
        forecast_days: "4",
        timezone: "auto",
      });
      const url = `${OPEN_METEO_BASE}?${params.toString()}`;
      const res = await fetch(url, { timeout: 8000 });
      if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
      const json = await res.json();
      if (!json.hourly) throw new Error("Open-Meteo response missing hourly data");

      // Downsample to every 6th hour, first 72h, to match the forecast cadence.
      const step = 6;
      const count = 13; // 0..72h inclusive at 6h steps
      const hourly = {
        time_offset_hours: [],
        wind_speed_10m: [],
        wind_direction_10m: [],
        relative_humidity_2m: [],
        temperature_2m: [],
      };
      for (let i = 0; i < count; i++) {
        const idx = i * step;
        hourly.time_offset_hours.push(i * step);
        hourly.wind_speed_10m.push(json.hourly.wind_speed_10m?.[idx] ?? null);
        hourly.wind_direction_10m.push(json.hourly.wind_direction_10m?.[idx] ?? null);
        hourly.relative_humidity_2m.push(json.hourly.relative_humidity_2m?.[idx] ?? null);
        hourly.temperature_2m.push(json.hourly.temperature_2m?.[idx] ?? null);
      }

      const result = { live: true, data: { city, hourly } };
      cacheSet(cacheKey, result, CACHE_TTL_MS);
      return result;
    } catch (err) {
      console.warn(`[open-meteo] Live fetch failed, using mock data: ${err.message}`);
    }
  }

  const mock = await loadMock("openmeteo", city);
  const result = { live: false, data: { city: mock.city, hourly: mock.hourly } };
  cacheSet(cacheKey, result, CACHE_TTL_MS);
  return result;
}
