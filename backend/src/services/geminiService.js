import fetch from "node-fetch";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-1.5-flash",
];

function getApiKey() {
  return process.env.GEMINI_API_KEY || null;
}

async function callGeminiApi(prompt, systemInstruction = "") {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const combinedText = systemInstruction
    ? `${systemInstruction}\n\n${prompt}`
    : prompt;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: combinedText }],
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[gemini] Model ${model} returned ${response.status}: ${errText.slice(0, 150)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { text, model };
      }
    } catch (err) {
      console.warn(`[gemini] Error calling model ${model}: ${err.message}`);
    }
  }

  return null;
}

/**
 * Get pollution source attribution via Google Gemini API
 */
export async function getGeminiAttribution({
  zoneName,
  aqi,
  trend,
  dominantPollutant,
  timeOfDay,
  season,
  windSpeed,
  windDirection,
  fireHotspotCount,
}) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const systemInstruction = `You are an atmospheric threat analyst for AirSense. Analyze signals and infer pollution sources. Respond in STRICT JSON ONLY.`;

  const prompt = `Telemetry Signals:
- Zone / Sector: ${zoneName}
- Current AQI Index: ${aqi} (Trend Vector: ${trend})
- Dominant Contaminant: ${dominantPollutant ?? "PM2.5"}
- Diurnal Cycle: ${timeOfDay}
- Seasonal Cycle: ${season}
- Surface Wind Vector: ${windSpeed ?? "N/A"} km/h at direction ${windDirection ?? "N/A"}°
- Satellite Thermal Fire Hotspots: ${fireHotspotCount}

Task: Infer primary and secondary pollution contributors.
Candidate categories: vehicular emissions, construction & road dust, industrial stack emissions, agricultural biomass burning, residential combustion, localized waste burning.

Respond with STRICT JSON ONLY matching this structure:
{
  "primary_source": "string (source name)",
  "primary_confidence": number (integer 40-85),
  "secondary_source": "string (source name)",
  "secondary_confidence": number (integer 15-45),
  "reasoning": "string (exactly 1 technical sentence explaining the causal signals)"
}`;

  const res = await callGeminiApi(prompt, systemInstruction);
  if (!res) return null;

  try {
    const cleaned = res.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      live: true,
      engine: "gemini",
      model: res.model,
      ...parsed,
    };
  } catch (err) {
    console.warn(`[gemini] JSON parse error: ${err.message}. Raw: ${res.text.slice(0, 100)}`);
    return null;
  }
}

/**
 * Get health advisory chat response via Google Gemini API
 */
export async function getGeminiChatResponse({ question, zoneName, aqi, forecastSummary }) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const systemInstruction = `You are Gemini-AirSense, an AI Atmospheric Health & Advisory Engine for citizens in Indian urban centers.
Detect the language of the prompt and respond fluently in that exact same language (English, Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, etc.).
Be clear, practical, and helpful (guidance on N95 masks, outdoor activities, sensitive groups).`;

  const prompt = `Context Data:
- Sector / Location: ${zoneName}
- Live AQI Index: ${aqi}
- 72-Hour Forecast Trajectory: ${forecastSummary}

Citizen Question: "${question}"

Provide a concise, practical, emergency-aware advisory (3-4 sentences).`;

  const res = await callGeminiApi(prompt, systemInstruction);
  if (!res) return null;

  return {
    live: true,
    engine: "gemini",
    model: res.model,
    answer: res.text.trim(),
  };
}
