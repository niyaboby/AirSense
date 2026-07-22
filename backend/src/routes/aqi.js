import { Router } from "express";
import { getStations } from "../services/waqiService.js";
import { aqiBucket } from "../services/aqiUtils.js";

const router = Router();

// City bounding boxes: [lat1, lon1, lat2, lon2] — expand this map to add more cities.
const CITY_BBOX = {
  bengaluru: [12.75, 77.35, 13.15, 77.85],
};

router.get("/", async (req, res) => {
  const city = req.query.city || "Bengaluru";
  const slug = city.toLowerCase();
  const bbox = CITY_BBOX[slug];

  const { live, data } = await getStations({ city, bbox });

  const stations = data.stations.map((s) => ({
    ...s,
    status: aqiBucket(s.aqi).label,
    color: aqiBucket(s.aqi).color,
  }));

  res.json({
    live,
    city: data.city,
    updatedAt: new Date().toISOString(),
    stations,
  });
});

export default router;
