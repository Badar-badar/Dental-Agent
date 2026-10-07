import { ChromaClient } from "chromadb";
import { config } from "../config/index.js";

const client = new ChromaClient({
  host: config.chromaHost,
  port: config.chromaPort,
  ssl: config.chromaSsl,
});
const NAME = "dental_price_list";

/** Get or create the collection used to store Gemini-generated embeddings. */
export async function getCollection() {
  return client.getOrCreateCollection({
    name: NAME,
    embeddingFunction: null,
    configuration: { hnsw: { space: "cosine" } },
  });
}

/** Replace the price-list collection with an empty collection. */
export async function resetCollection() {
  try {
    await client.deleteCollection({ name: NAME });
  } catch {
    // The collection may not exist on the first ingest.
  }
  return getCollection();
}

/** Wait for Chroma to answer its heartbeat, or fail after the configured retries. */
export async function waitForChroma(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.heartbeat();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error("Chroma is not reachable");
}
