# AirSense

AI-powered urban air quality intelligence platform for Indian cities. Fuses live AQI sensor
data, weather forecasts, and satellite fire-hotspot data into one dashboard: a live geospatial
AQI map, a 72-hour forecast, an AI-generated pollution source attribution, and a multilingual
citizen health-advisory chatbot.

Built as a hackathon prototype — see [`architecture.md`](./architecture.md) for the data-flow
diagram, and the **What's real vs. mocked** section below before you demo it.

## Quick start

You need two terminals — one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in whichever keys you have — see below
npm start
```

Runs on `http://localhost:8787` by default. Visit `http://localhost:8787/api/health` to check
which keys are detected.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # only needed if your backend isn't on localhost:8787
npm run dev
```

Runs on `http://localhost:5173` by default (Vite's dev server).

**The app works fully with zero API keys set** — every data source falls back to a clearly
labeled mock/cached dataset. This means you can demo it offline or before your keys are approved.
Look for the **Live** / **Cached data** badge next to each panel — it tells you, at a glance,
whether that particular piece of data is real-time or a fallback.

## API keys (all free, all optional)

| Service | Used for | Get a key |
|---|---|---|
| WAQI | Live station AQI readings | https://aqicn.org/data-platform/token/ |
| NASA FIRMS | Active fire/thermal hotspots | https://firms.modaps.eosdis.nasa.gov/api/area/ |
| Anthropic | Source attribution + chatbot | https://console.anthropic.com/ |
| Open-Meteo | Wind/humidity/temp forecast | No key needed |

Add whichever you have to `backend/.env`. Missing keys don't break anything — that data source
just serves its mock fixture instead, with a console warning and a `live: false` flag in the API
response.

## What's real vs. mocked

| Feature | Real data source | Mocked / simplified |
|---|---|---|
| Live AQI map | WAQI station feed (when `WAQI_TOKEN` set) | Falls back to `backend/src/data/mock/waqi_bengaluru.json` — 10 hand-placed Bengaluru stations |
| 72h forecast | Open-Meteo wind/humidity/temp (no key needed) | The *forecast model itself* is a heuristic (persistence + wind/humidity adjustment), **not** a trained dispersion model — labeled as such in the UI tooltip and API response |
| Source attribution | Claude reasoning over live wind + FIRMS signals (when `ANTHROPIC_API_KEY` set) | Falls back to a simple rule-of-thumb mock attribution; even when live, this is LLM reasoning over indirect signals, not a validated causal model — the UI says so explicitly |
| Fire hotspots | NASA FIRMS VIIRS 24h product (when `FIRMS_MAP_KEY` set) | Falls back to `backend/src/data/mock/firms_bengaluru.json` — 4 sample hotspots |
| Chatbot | Claude, detects and replies in the question's language | Falls back to a canned English mock response, clearly prefixed `MOCK RESPONSE` |
| Traffic density / construction permits | — | **Fully mocked**, not wired to any real feed. Not currently surfaced in the UI at all — flagged here as a Phase 2 item (see below), since a real backend for it doesn't exist yet |
| Multi-city comparison | — | **Out of scope for this prototype** — see Roadmap |
| User accounts / auth | — | **Not implemented** — no auth needed per the brief |

### Adding a new city

The mock fixtures are per-city files (`waqi_<city>.json`, `openmeteo_<city>.json`,
`firms_<city>.json` in `backend/src/data/mock/`). To add a city:

1. Copy the Bengaluru fixture files and rename with your city's slug (e.g. `waqi_kochi.json`).
2. Edit the station list / coordinates / AQI values to match real ward locations.
3. Add the city's bounding box to `CITY_BBOX` in `backend/src/routes/aqi.js` so live WAQI queries
   work too.
4. Update `CITY` in `frontend/src/App.jsx` (currently hardcoded to `"Bengaluru"` — a city picker
   is a natural next step, see Roadmap).

If a city-specific mock file is missing, the backend logs a warning and falls back to the
Bengaluru fixture rather than crashing.

## Roadmap (Phase 2 — not built here)

- **Trained dispersion model** to replace the heuristic 72h forecast (e.g. a WRF-Chem-based or
  data-driven spatiotemporal model)
- **Multi-city dashboard** with a city switcher and cross-city comparison view
- **Real traffic + construction-permit feeds** wired into the source attribution prompt, replacing
  the currently-absent mock values
- **Enforcement-prioritization agent** — surfaces which zones/sources are highest-impact for
  municipal intervention
- **Validated causal attribution** — today's source attribution is LLM reasoning over indirect
  signals (wind, time of day, season, fire-hotspot proximity); a production version would need
  grounding in a validated source-apportionment model (e.g. receptor modeling / chemical mass
  balance) before being used for policy decisions
- User accounts, saved zones, push alerts for AQI threshold crossings

## Project structure

```
airsense/
├── architecture.md          # data-flow diagram (mermaid)
├── README.md                 # this file
├── backend/
│   ├── src/
│   │   ├── server.js          # Express entry point
│   │   ├── routes/            # /api/aqi, /api/forecast, /api/attribution, /api/chat
│   │   ├── services/          # waqi, open-meteo, firms, claude, forecast, cache
│   │   └── data/mock/         # per-city fallback fixtures
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx             # dashboard layout
    │   ├── components/         # AqiMap, ZonePanel, ForecastChart, ChatBox, LiveBadge, AqiLegend
    │   ├── api/client.js       # backend API client
    │   └── lib/aqi.js          # AQI bucketing shared with backend
    └── .env.example
```

## Tech stack

- Frontend: React + Vite, Tailwind CSS, Leaflet (`react-leaflet`), Recharts
- Backend: Node.js + Express
- LLM: Anthropic Claude API (`claude-sonnet-4-6`)
- No database — in-memory cache for the demo session
