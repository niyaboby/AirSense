export function aqiBucket(aqi) {
  if (aqi == null) return { label: "Unknown", color: "#9CA3AF" };
  if (aqi <= 50) return { label: "Good", color: "#4C9A5B" };
  if (aqi <= 100) return { label: "Moderate", color: "#D6A419" };
  if (aqi <= 200) return { label: "Poor", color: "#E07A2C" };
  if (aqi <= 300) return { label: "Very Poor", color: "#C23B3B" };
  return { label: "Severe", color: "#7A1F1F" };
}

export function currentTimeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

export function currentSeason(date = new Date()) {
  // Rough Indian seasonal buckets by month.
  const m = date.getMonth() + 1;
  if (m === 12 || m <= 2) return "winter";
  if (m >= 3 && m <= 5) return "summer";
  if (m >= 6 && m <= 9) return "monsoon";
  return "post-monsoon"; // Oct-Nov, peak crop-burning/smog season in North India
}
