import { getAnthropic } from "./anthropic";

export interface NormalizedQuery {
  canonical_en: string;
  devanagari: string;
  detected_script: "english" | "devanagari" | "roman_nepali";
}

export async function normalizeQuery(
  question: string
): Promise<NormalizedQuery> {
  try {
    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `You normalize queries for a Nepali government services helpdesk.
Given a user question (which may be in English, Nepali Devanagari, or Roman-script Nepali), return ONLY a JSON object with no markdown fences:
{"canonical_en":"the question restated as a short plain-English search query","devanagari":"the question in Devanagari Nepali","detected_script":"english"|"devanagari"|"roman_nepali"}`,
      messages: [{ role: "user", content: question }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      canonical_en: question,
      devanagari: question,
      detected_script: "english",
    };
  }
}
