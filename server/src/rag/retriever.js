import { embedQuery } from "./embeddings.js";
import { getCollection } from "./vectorStore.js";

/** Search the embedded clinic price list and return the closest text chunks. */
export async function searchPriceList(query, k = 4) {
  const collection = await getCollection();
  const queryEmbedding = await embedQuery(query);
  const result = await collection.query({ queryEmbeddings: [queryEmbedding], nResults: k });
  return (result.documents?.[0] || []).filter(Boolean);
}
