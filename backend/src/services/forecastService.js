/**
 * Heuristic forecast: NOT a trained dispersion model.
 * Starts from the current AQI (persistence) and nudges it up/down at each
 * timestep based on wind speed and humidity, per simple, explainable rules:
 *   - Strong wind (>15 km/h)   -> disperses pollutants -> AQI trends down
 *   - Low wind (<8 km/h)       -> pollutants accumulate -> AQI trends up
 *   - High humidity (>75%)     -> particulates stay suspended -> AQI trends up
 *   - Low humidity (<50%)      -> slight downward pull
 * Adjustments are capped so the curve stays plausible over 72h.
 *
 * A production version would replace this with a trained atmospheric
 * dispersion model (e.g. WRF-Chem or a data-driven spatiotemporal model).
 */
export function computeForecast({ currentAqi, hourly }) {
  const { time_offset_hours, wind_speed_10m, relative_humidity_2m } = hourly;

  let aqi = currentAqi;
  const points = [];

  for (let i = 0; i < time_offset_hours.length; i++) {
    const hour = time_offset_hours[i];
    const wind = wind_speed_10m[i] ?? 10;
    const humidity = relative_humidity_2m[i] ?? 60;

    if (hour > 0) {
      let delta = 0;
      if (wind > 15) delta -= 8;
      else if (wind < 8) delta += 6;

      if (humidity > 75) delta += 4;
      else if (humidity < 50) delta -= 2;

      // Small mean-reversion so the curve doesn't run away over 72h.
      delta += (currentAqi - aqi) * 0.05;

      aqi = Math.max(5, Math.round(aqi + delta));
    }

    points.push({
      hour_offset: hour,
      aqi,
      wind_speed_10m: wind,
      relative_humidity_2m: humidity,
    });
  }

  return {
    model: "heuristic-persistence-plus-adjustment",
    disclaimer:
      "Heuristic forecast based on wind + humidity trends, not a trained dispersion model. A production version would use one.",
    points,
  };
}
