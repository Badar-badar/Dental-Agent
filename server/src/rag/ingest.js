import fs from "node:fs";
import { fileURLToPath } from "node:url";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { config } from "../config/index.js";
import { info } from "../utils/logger.js";
import { chunkText } from "./chunking.js";
import { embedDocuments } from "./embeddings.js";
import { generatePdf, PDF_PATH } from "./pdf/generatePdf.js";
import { getCollection, resetCollection, waitForChroma } from "./vectorStore.js";

/** Generate, chunk, embed, and store the clinic price-list PDF in Chroma. */
export async function ingest({ force = false } = {}) {
  await waitForChroma();
  let collection = await getCollection();
  if (!force && (await collection.count()) > 0) {
    info("rag", "collection already populated, skipping ingest");
    return;
  }
  if (force) collection = await resetCollection();

  if (!fs.existsSync(PDF_PATH)) await generatePdf(config.clinic.name);
  const { text } = await pdf(fs.readFileSync(PDF_PATH));
  const chunks = chunkText(text);
  info("rag", `${chunks.length} chunks from price-list.pdf`);

  const embeddings = await embedDocuments(chunks);
  await collection.add({
    ids: chunks.map((_, index) => `chunk-${index}`),
    documents: chunks,
    embeddings,
    metadatas: chunks.map((chunk) => ({ source: "price-list.pdf", section: chunk.split("\n")[0] })),
  });
  info("rag", "ingest complete");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ingest({ force: process.argv.includes("--force") }).then(() => process.exit(0));
}
