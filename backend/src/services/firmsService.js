import fetch from "node-fetch";
import { cacheGet, cacheSet } from "./cache.js";
import { loadMock } from "./mockData.js";

// FIRMS "area" CSV API: distance-based query around a point, VIIRS 24h product.
const FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — fire hotspot products refresh a few times a day

/**
 * Fetch active fire/thermal hotspots within a radius of a point, last 24h.
 * Used as a rough proxy for crop-burning contribution to regional AQI.
 *
 * @param {object} opts
 * @param {number} opts.lat
 * @param {number} opts.lon
 * @param {number} [opts.radiusDeg=1] - bounding box half-width in degrees (~100km)
 * @param {string} opts.city - used only for mock fallback selection
 * @returns {Promise<{ live: boolean, data: object }>}
 */
export async function getFireHotspots({ lat, lon, radiusDeg = 1, city = "Bengaluru" } = {}) {
  const cacheKey = `firms:${lat},${lon},${radiusDeg}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const mapKey = process.env.FIRMS_MAP_KEY;

  if (mapKey && Number.isFinite(lat) && Number.isFinite(lon)) {
    try {
      const west = lon - radiusDeg;
      const east = lon + radiusDeg;
      const south = lat - radiusDeg;
      const north = lat + radiusDeg;
      // VIIRS_SNPP_NRT source, 1 day of data, area bbox format: west,south,east,north
      const url = `${FIRMS_BASE}/${mapKey}/VIIRS_SNPP_NRT/${west},${south},${east},${north}/1`;
      const res = await fetch(url, { timeout: 8000 });
      if (!res.ok) throw new Error(`FIRMS HTTP ${res.status}`);
      const csv = await res.text();
      const hotspots = parseFirmsCsv(csv);

      const result = { live: true, data: { region: `${city} ~${Math.round(radiusDeg * 111)}km radius`, hotspots } };
      cacheSet(cacheKey, result, CACHE_TTL_MS);
      return result;
    } catch (err) {
      console.warn(`[firms] Live fetch failed, using mock data: ${err.message}`);
    }
  } else if (!mapKey) {
    console.warn("[firms] FIRMS_MAP_KEY not set — using mock data. Free signup at firms.modaps.eosdis.nasa.gov/api/area/");
  }

  const mock = await loadMock("firms", city);
  const result = { live: false, data: { region: mock.region, hotspots: mock.hotspots } };
  cacheSet(cacheKey, result, CACHE_TTL_MS);
  return result;
}

function parseFirmsCsv(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const latIdx = header.indexOf("latitude");
  const lonIdx = header.indexOf("longitude");
  const confIdx = header.indexOf("confidence");
  const timeIdx = header.indexOf("acq_time");

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      lat: Number(cols[latIdx]),
      lon: Number(cols[lonIdx]),
      confidence: Number(cols[confIdx]) || null,
      detected_hours_ago: null, // would require parsing acq_date/acq_time vs now
      acq_time: cols[timeIdx] ?? null,
    };
  });
}
