import fetch from "node-fetch";
import { cacheGet, cacheSet } from "./cache.js";
import { loadMock } from "./mockData.js";

const WAQI_BASE = "https://api.waqi.info";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — live AQI doesn't need to be hit every request

/**
 * Fetch WAQI station AQI readings within a city.
 * WAQI's free tier exposes a "map/bounds" endpoint (stations in a lat/lon box)
 * and a per-station "feed" endpoint. We use map/bounds for the heatmap.
 *
 * @param {object} opts
 * @param {string} opts.city - city name, used for mock fallback selection
 * @param {[number, number, number, number]} opts.bbox - [lat1, lon1, lat2, lon2]
 * @returns {Promise<{ live: boolean, data: object }>}
 */
export async function getStations({ city = "Bengaluru", bbox } = {}) {
  const cacheKey = `waqi:${city}:${bbox?.join(",") ?? "default"}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const token = process.env.WAQI_TOKEN;

  if (token && bbox) {
    try {
      const [lat1, lon1, lat2, lon2] = bbox;
      const url = `${WAQI_BASE}/map/bounds/?latlng=${lat1},${lon1},${lat2},${lon2}&token=${token}`;
      const res = await fetch(url, { timeout: 8000 });
      if (!res.ok) throw new Error(`WAQI HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== "ok" || !Array.isArray(json.data)) {
        throw new Error(`WAQI status: ${json.status}`);
      }

      const stations = json.data.map((s) => ({
        id: String(s.uid),
        name: s.station?.name ?? "Unknown station",
        lat: s.lat,
        lon: s.lon,
        aqi: Number.isFinite(Number(s.aqi)) ? Number(s.aqi) : null,
        dominant_pollutant: null, // requires a per-station /feed/ call — see getStationDetail
        trend: null,
      }));

      const result = { live: true, data: { city, stations } };
      cacheSet(cacheKey, result, CACHE_TTL_MS);
      return result;
    } catch (err) {
      console.warn(`[waqi] Live fetch failed, using mock data: ${err.message}`);
    }
  } else if (!token) {
    console.warn("[waqi] WAQI_TOKEN not set — using mock data. Get a free token at aqicn.org/api");
  }

  const mock = await loadMock("waqi", city);
  const result = { live: false, data: { city: mock.city, stations: mock.stations } };
  cacheSet(cacheKey, result, CACHE_TTL_MS);
  return result;
}

/**
 * Fetch detail (dominant pollutant, AQI) for a single WAQI station by station id.
 * Only used when we have a live token; mock stations already carry this info.
 */
export async function getStationDetail(stationId) {
  const token = process.env.WAQI_TOKEN;
  if (!token) return null;

  const cacheKey = `waqi:station:${stationId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const url = `${WAQI_BASE}/feed/@${stationId}/?token=${token}`;
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) throw new Error(`WAQI HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== "ok") throw new Error(`WAQI status: ${json.status}`);

    const detail = {
      aqi: json.data.aqi,
      dominant_pollutant: json.data.dominentpol ?? null,
      iaqi: json.data.iaqi ?? {},
      time: json.data.time?.s ?? null,
    };
    cacheSet(cacheKey, detail, CACHE_TTL_MS);
    return detail;
  } catch (err) {
    console.warn(`[waqi] Station detail fetch failed for ${stationId}: ${err.message}`);
    return null;
  }
}
