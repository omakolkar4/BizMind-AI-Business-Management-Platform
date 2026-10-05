import OpenAI from "openai";

export function isDemoMode(): boolean {
  if (process.env.AI_MODE === "demo") return true;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") return true;
  return false;
}

export function getOpenAIClient(): OpenAI | null {
  if (isDemoMode()) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
