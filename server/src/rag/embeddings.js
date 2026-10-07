import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const ai = new GoogleGenAI({ apiKey: config.geminiKey });

function normalize(values) {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => value / norm);
}

async function embed(texts, taskType) {
  const response = await ai.models.embedContent({
    model: config.embedModel,
    contents: texts,
    config: { taskType, outputDimensionality: config.embedDims },
  });
  return response.embeddings.map((embedding) => normalize(embedding.values));
}

/** Embed document chunks for storage in Chroma. */
export const embedDocuments = (texts) => embed(texts, "RETRIEVAL_DOCUMENT");

/** Embed one search query using Gemini's retrieval-query task type. */
export const embedQuery = async (text) => (await embed([text], "RETRIEVAL_QUERY"))[0];
