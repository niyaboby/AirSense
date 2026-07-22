# AirSense 🌫️

**AI-powered urban air quality intelligence platform for Indian cities.**

AirSense fuses live AQI sensor data, weather forecasts, and satellite fire-hotspot data into a
single real-time dashboard, giving both citizens and city officials a clearer picture of *what*
the air quality is, *why* it's that way, and *what to do about it*.





## 🎥 Demo video


https://github.com/user-attachments/assets/bf94075d-1b31-4b79-93a7-3be643253a9e


## ✨ Features

- 🗺️ **Live geospatial AQI heatmap** — color-coded stations/zones across the city, click any one
  to drill in
- 📈 **72-hour AQI forecast** — per-zone forecast chart adjusted using live wind/humidity trends
- 🔍 **AI-generated pollution source attribution** — for a selected zone, an LLM reasons over
  wind direction, time of day, season, and nearby fire-hotspot activity to estimate the likely
  source (vehicular, construction dust, biomass burning, etc.) with a confidence score
- 💬 **Multilingual citizen chatbot** — ask a question in English, Hindi, Kannada, or others, and
  get a plain-language, personalized health advisory grounded in the selected zone's current AQI
  and forecast (accounts for sensitive groups: children, elderly, respiratory conditions)

## 🖥️ Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Leaflet.js (map), Recharts (forecast chart) |
| Backend | Node.js + Express |
| LLM | **Google Gemini API** — powers the source attribution agent and the citizen chatbot |
| Live data sources | [WAQI](https://aqicn.org/api/) (AQI readings), [Open-Meteo](https://open-meteo.com/) (weather, no key needed), [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/) (fire hotspots) |
| Storage | None — in-memory cache for the demo session, no database, no auth |

## 🚀 Getting started

You'll need two terminals — one for the backend, one for the frontend.

### 1. Clone and install

```bash
git clone <your-repo-url>
cd airsense
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in whichever keys you have (see [Getting API keys](#-getting-api-keys) below
— **the app runs fully on mock data with zero keys set**):

```env
WAQI_TOKEN=
FIRMS_MAP_KEY=
GEMINI_API_KEY=
PORT=
CORS_ORIGIN=
```

Start the server:

```bash
npm start
```

Runs on `http://localhost:8787`. Check `http://localhost:8787/api/health` to confirm which keys
were detected.

### 3. Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env    # only needed if backend isn't on localhost:8787
npm run dev
```

Runs on `http://localhost:5173`. Open that URL in your browser — the dashboard should load with
the AQI map, and clicking any station populates the forecast, source attribution, and chatbot.

## 🔑 Getting API keys

All of these are free. None are required to run the app — missing keys just mean that piece of
data falls back to a mock fixture, clearly flagged with a "Cached data" badge in the UI.

| Key | Where to get it | Notes |
|---|---|---|
| `WAQI_TOKEN` | https://aqicn.org/data-platform/token/ | Enter your email, token arrives instantly, no approval wait |
| `FIRMS_MAP_KEY` | https://firms.modaps.eosdis.nasa.gov/api/area/ | Short signup form, key emailed immediately |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Sign in with a Google account, click "Create API key" — Google AI Studio gives free-tier quota, no card required to start |
| Open-Meteo | No key needed | Used directly, no signup |

After adding a key to `backend/.env`, restart the backend (`npm start`) — the startup log will
stop warning about that key, and `/api/health` will show it as `true`.



### Adding a new city

1. Copy `waqi_bengaluru.json` / `openmeteo_bengaluru.json` / `firms_bengaluru.json` and rename with
   your city's slug (e.g. `waqi_kochi.json`).
2. Edit station coordinates/AQI values to match real ward locations.
3. Add the city's bounding box to `CITY_BBOX` in `backend/src/routes/aqi.js`.
4. Update the `CITY` constant in `frontend/src/App.jsx`.

## 🗺️ Roadmap

- Trained atmospheric dispersion model to replace the heuristic forecast
- Multi-city dashboard with a city switcher
- Real traffic + construction-permit feeds in the attribution prompt
- Enforcement-prioritization agent for municipal teams
- Validated causal source-apportionment model (receptor modeling / chemical mass balance) before
  any use in real policy decisions
- User accounts, saved zones, AQI threshold push alerts
