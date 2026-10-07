import { embedQuery } from "./embed.js";
import { getCollection } from "./chroma.js";

export async function searchPriceList(query, k = 4) {
  const collection = await getCollection();
  const queryEmbedding = await embedQuery(query);
  const res = await collection.query({ queryEmbeddings: [queryEmbedding], nResults: k });
  return (res.documents?.[0] || []).filter(Boolean);
}
