import { embedQuery } from "./embeddings.js";
import { ingest } from "./ingest.js";
import { getCollection } from "./vectorStore.js";

let emptyCollectionIngestPromise;

/** Search the embedded clinic price list and return the closest text chunks. */
export async function searchPriceList(query, k = 4) {
  let collection = await getCollection();
  if ((await collection.count()) === 0) {
    if (!emptyCollectionIngestPromise) {
      emptyCollectionIngestPromise = ingest({ force: true }).finally(() => {
        emptyCollectionIngestPromise = undefined;
      });
    }
    await emptyCollectionIngestPromise;
    collection = await getCollection();
  }
  const queryEmbedding = await embedQuery(query);
  const result = await collection.query({ queryEmbeddings: [queryEmbedding], nResults: k });
  return (result.documents?.[0] || []).filter(Boolean);
}
