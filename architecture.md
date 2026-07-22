# AirSense — Architecture

```mermaid
flowchart TD
    subgraph External Data Sources
        WAQI["WAQI API<br/>(live station AQI)"]
        OM["Open-Meteo API<br/>(wind / humidity / temp)"]
        FIRMS["NASA FIRMS API<br/>(fire hotspots)"]
        Claude["Anthropic Claude API<br/>(claude-sonnet-4-6)"]
    end

    subgraph Backend ["Backend — Node + Express (in-memory cache only)"]
        AqiSvc["waqiService"]
        MetSvc["openMeteoService"]
        FirmsSvc["firmsService"]
        ForecastSvc["forecastService<br/>(heuristic model)"]
        ClaudeSvc["claudeService<br/>(attribution + chat prompts)"]
        Mock["mock/*.json fallbacks<br/>(used on missing key or failed call,<br/>logged + flagged, never silent)"]

        RAqi["/api/aqi"]
        RForecast["/api/forecast"]
        RAttr["/api/attribution"]
        RChat["/api/chat"]
    end

    subgraph Frontend ["Frontend — React + Vite + Tailwind"]
        Map["AqiMap<br/>(Leaflet heatmap)"]
        Zone["ZonePanel<br/>(AQI + source attribution)"]
        Fc["ForecastChart<br/>(Recharts, 72h line)"]
        Chat["ChatBox<br/>(citizen health advisory)"]
        Badge["LiveBadge<br/>(live vs cached indicator)"]
    end

    WAQI --> AqiSvc
    OM --> MetSvc
    FIRMS --> FirmsSvc
    Claude --> ClaudeSvc

    AqiSvc -.fallback.-> Mock
    MetSvc -.fallback.-> Mock
    FirmsSvc -.fallback.-> Mock
    ClaudeSvc -.fallback.-> Mock

    AqiSvc --> RAqi
    MetSvc --> RForecast
    ForecastSvc --> RForecast
    MetSvc --> RAttr
    FirmsSvc --> RAttr
    ClaudeSvc --> RAttr
    ClaudeSvc --> RChat

    RAqi --> Map
    Map -- "click station" --> Zone
    RAttr --> Zone
    RForecast --> Fc
    RChat --> Chat
    RAqi -. live/cached flag .-> Badge
    RAttr -. live/cached flag .-> Badge
    RForecast -. live/cached flag .-> Badge
    RChat -. live/cached flag .-> Badge
```

## Data flow, in words

1. **Map load** — the frontend calls `GET /api/aqi?city=Bengaluru`. The backend asks `waqiService` for stations in the city's bounding box; if `WAQI_TOKEN` is unset or the call fails, it transparently falls back to `data/mock/waqi_bengaluru.json` and marks the response `live: false`.
2. **Zone selection** — clicking a station on the map triggers two backend calls in parallel:
   - `GET /api/forecast` — pulls Open-Meteo wind/humidity/temp for that point (or mock), then runs it through the heuristic `forecastService` to produce a 72h AQI curve.
   - `POST /api/attribution` — pulls the same weather data plus NASA FIRMS fire-hotspot count near the point, builds a signal summary, and sends it to Claude with a strict-JSON prompt for source attribution.
3. **Chat** — the citizen types a question; the backend forwards it to Claude along with the selected zone's current AQI and forecast summary, and Claude replies in the same language the question was asked in.
4. **Transparency** — every backend response that could be live-or-mocked carries a `live: boolean` flag. The frontend's `LiveBadge` component surfaces this everywhere, so cached/mock data is never silently presented as live.

## Why no database

Per the brief, this is a single-session hackathon prototype. All API responses are cached in-memory (`services/cache.js`, simple TTL map) for the life of the Node process — nothing persists across restarts, and there's no user data to persist anyway (no auth).
