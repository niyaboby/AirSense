import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DIR = path.join(__dirname, "..", "data", "mock");

/** Turn "Bengaluru" -> "bengaluru", "New Delhi" -> "new_delhi" etc. */
export function citySlug(city) {
  return String(city || "bengaluru")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Load a mock JSON fixture for a given dataset ("waqi" | "openmeteo" | "firms") and city.
 * Falls back to the bengaluru fixture if a city-specific file doesn't exist yet,
 * so new cities always demo something rather than throwing — but this is logged
 * clearly so it's never confused with a real match.
 */
export async function loadMock(dataset, city) {
  const slug = citySlug(city);
  const primaryPath = path.join(MOCK_DIR, `${dataset}_${slug}.json`);
  try {
    const raw = await readFile(primaryPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    console.warn(
      `[mock] No ${dataset} fixture for city "${city}" (looked for ${dataset}_${slug}.json). ` +
        `Falling back to bengaluru fixture. Add ${dataset}_${slug}.json to enable this city.`
    );
    const fallbackPath = path.join(MOCK_DIR, `${dataset}_bengaluru.json`);
    const raw = await readFile(fallbackPath, "utf-8");
    return JSON.parse(raw);
  }
}
