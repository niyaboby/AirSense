import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

/**
 * Ask Claude to attribute the likely pollution source(s) for a zone,
 * given current signals. Returns strict JSON — see ATTRIBUTION_SCHEMA below.
 * IMPORTANT: this is LLM reasoning over available signals, not a validated
 * causal model. It is presented to the user with that caveat in the UI.
 */
export async function getSourceAttribution({
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
  const client = getClient();
  if (!client) {
    return mockAttribution({ aqi, fireHotspotCount });
  }

  const prompt = `You are an air-quality source attribution assistant for an Indian city dashboard.
Given the signals below, infer the most likely pollution source(s) affecting this zone right now.
This is exploratory reasoning over indirect signals, not a validated causal model — be appropriately
uncertain in your confidence scores (they should rarely exceed 80).

Signals:
- Zone: ${zoneName}
- Current AQI: ${aqi} (trend: ${trend})
- Dominant pollutant: ${dominantPollutant ?? "unknown"}
- Time of day: ${timeOfDay}
- Season: ${season}
- Wind: ${windSpeed} km/h from direction ${windDirection}°
- Nearby active fire hotspots (last 24h, ~100km radius): ${fireHotspotCount}

Typical sources to consider: vehicular emissions, construction dust, industrial emissions,
crop/biomass burning, residential burning/cooking, road dust resuspension.

Respond with STRICT JSON ONLY, no preamble, no markdown fences, matching exactly this shape:
{"primary_source": string, "primary_confidence": number, "secondary_source": string, "secondary_confidence": number, "reasoning": string}
The "reasoning" field must be exactly one sentence.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { live: true, ...parsed };
  } catch (err) {
    console.warn(`[claude] Attribution call failed, using mock: ${err.message}`);
    return mockAttribution({ aqi, fireHotspotCount });
  }
}

function mockAttribution({ aqi, fireHotspotCount }) {
  // MOCK: simple rule-of-thumb standing in for the LLM call when no API key is set.
  if (fireHotspotCount >= 3) {
    return {
      live: false,
      primary_source: "crop/biomass burning",
      primary_confidence: 58,
      secondary_source: "vehicular",
      secondary_confidence: 27,
      reasoning: "MOCK: Elevated nearby fire-hotspot count suggests a meaningful biomass-burning contribution alongside typical traffic load.",
    };
  }
  return {
    live: false,
    primary_source: "vehicular",
    primary_confidence: 62,
    secondary_source: "construction dust",
    secondary_confidence: 24,
    reasoning: "MOCK: Elevated AQI with no major fire activity nearby points to traffic as the dominant likely contributor.",
  };
}

/**
 * Ask Claude to answer a citizen's air-quality/health question, responding in
 * whichever language the person used, grounded in the selected zone's data.
 */
export async function getChatResponse({ question, zoneName, aqi, forecastSummary }) {
  const client = getClient();
  if (!client) {
    return mockChatResponse();
  }

  const prompt = `You are a plain-language air-quality health advisor for a citizen dashboard in India.
Detect the language of the user's question and respond in that same language (support at minimum
English, Hindi, and Kannada, but do your best with any language the user writes in).

Context:
- Selected zone: ${zoneName}
- Current AQI: ${aqi}
- 72-hour forecast summary: ${forecastSummary}
- Sensitive groups to consider when relevant: children, elderly, people with respiratory conditions

User question: "${question}"

Give a short, practical, plain-language answer (3-5 sentences). Avoid alarmism; be specific and
actionable (e.g. mask type, time-of-day advice, whether to limit outdoor activity). Do not diagnose
any medical condition — recommend seeing a doctor for anything beyond general air-quality precaution.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    return { live: true, answer: text.trim() };
  } catch (err) {
    console.warn(`[claude] Chat call failed, using mock: ${err.message}`);
    return mockChatResponse();
  }
}

function mockChatResponse() {
  return {
    live: false,
    answer:
      "MOCK RESPONSE (no ANTHROPIC_API_KEY set): At the current AQI level, sensitive groups — children, older adults, and people with respiratory conditions — should limit prolonged outdoor exertion, especially in the afternoon. An N95 mask is a reasonable precaution outdoors. If you experience persistent coughing or breathing difficulty, please consult a doctor.",
  };
}
