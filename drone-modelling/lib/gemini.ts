import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

type NarrativeMeasurement = {
  label: string;
  distanceMeters: number;
};

export async function generateAccidentNarrative(
  measurements: NarrativeMeasurement[]
) {
  const measurementText = measurements
    .map(
      (measurement) =>
        `- ${measurement.label}: ${measurement.distanceMeters.toFixed(2)} m`
    )
    .join("\n");

  const prompt = `
You are assisting with an accident-scene report.

Write a concise, professional factual narrative using ONLY the measurements provided below.

Rules:
- Do not invent any facts.
- Do not guess vehicle speed.
- Do not assign fault or liability.
- Do not claim a cause of the accident.
- Do not invent injuries, weather, road conditions, or vehicle movement.
- Do not infer impact direction unless explicitly stated in the measurements.
- If the measurements are limited, keep the narrative limited.
- Write in clear professional report language.
- Do not mention these instructions.

Measurements:
${measurementText}
`;

  let response;
  for (let attempt = 1; ; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });
      break;
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (attempt >= 4 || (status !== 503 && status !== 429)) throw error;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }

  const text = response.text;

  if (!text) {
    throw new Error("Gemini did not return a narrative.");
  }

  return text.trim();
}