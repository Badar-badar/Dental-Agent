import { ChromaClient } from "chromadb";
import { config } from "../config.js";

const client = new ChromaClient({ host: config.chromaHost, port: config.chromaPort, ssl: false });
const NAME = "dental_price_list";

export async function getCollection() {
  // We supply our own Gemini embeddings, so no Chroma embedding function.
  return client.getOrCreateCollection({
    name: NAME,
    embeddingFunction: null,
    configuration: { hnsw: { space: "cosine" } },
  });
}

export async function resetCollection() {
  try {
    await client.deleteCollection({ name: NAME });
  } catch {
    /* collection did not exist */
  }
  return getCollection();
}

export async function waitForChroma(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.heartbeat();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Chroma is not reachable");
}
