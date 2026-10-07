import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";

const ai = new GoogleGenAI({ apiKey: config.geminiKey });

function normalize(v) {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

async function embed(texts, taskType) {
  const res = await ai.models.embedContent({
    model: config.embedModel,
    contents: texts,
    config: { taskType, outputDimensionality: config.embedDims },
  });
  // Truncated (non-3072) embeddings are not normalized by the API.
  return res.embeddings.map((e) => normalize(e.values));
}

export const embedDocuments = (texts) => embed(texts, "RETRIEVAL_DOCUMENT");
export const embedQuery = async (text) => (await embed([text], "RETRIEVAL_QUERY"))[0];
