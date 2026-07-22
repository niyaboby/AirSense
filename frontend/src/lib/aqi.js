export function aqiBucket(aqi) {
  if (aqi == null) return { label: "Unknown", color: "#9CA3AF" };
  if (aqi <= 50) return { label: "Good", color: "#4C9A5B" };
  if (aqi <= 100) return { label: "Moderate", color: "#D6A419" };
  if (aqi <= 200) return { label: "Poor", color: "#E07A2C" };
  if (aqi <= 300) return { label: "Very Poor", color: "#C23B3B" };
  return { label: "Severe", color: "#7A1F1F" };
}

export const AQI_SCALE = [
  { max: 50, label: "Good", color: "#4C9A5B" },
  { max: 100, label: "Moderate", color: "#D6A419" },
  { max: 200, label: "Poor", color: "#E07A2C" },
  { max: 300, label: "Very Poor", color: "#C23B3B" },
  { max: Infinity, label: "Severe", color: "#7A1F1F" },
];
