const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchAqiStations(city = "Bengaluru") {
  return request(`/api/aqi?city=${encodeURIComponent(city)}`);
}

export function fetchForecast({ lat, lon, city, aqi }) {
  const params = new URLSearchParams({ lat, lon, city, aqi });
  return request(`/api/forecast?${params.toString()}`);
}

export function fetchAttribution({ zoneName, lat, lon, aqi, trend, dominantPollutant, city }) {
  return request(`/api/attribution`, {
    method: "POST",
    body: JSON.stringify({ zoneName, lat, lon, aqi, trend, dominantPollutant, city }),
  });
}

export function askChat({ question, zoneName, aqi, forecastSummary }) {
  return request(`/api/chat`, {
    method: "POST",
    body: JSON.stringify({ question, zoneName, aqi, forecastSummary }),
  });
}
