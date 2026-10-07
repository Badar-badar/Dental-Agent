import fs from "node:fs";
import { fileURLToPath } from "node:url";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { config } from "../config.js";
import { generatePdf, PDF_PATH } from "./generatePdf.js";
import { chunkText } from "./chunk.js";
import { embedDocuments } from "./embed.js";
import { getCollection, resetCollection, waitForChroma } from "./chroma.js";

export async function ingest({ force = false } = {}) {
  await waitForChroma();
  let collection = await getCollection();
  if (!force && (await collection.count()) > 0) {
    console.log("[rag] collection already populated, skipping ingest");
    return;
  }
  if (force) collection = await resetCollection();

  if (!fs.existsSync(PDF_PATH)) await generatePdf(config.clinic.name);
  const { text } = await pdf(fs.readFileSync(PDF_PATH));
  const chunks = chunkText(text);
  console.log(`[rag] ${chunks.length} chunks from price-list.pdf`);

  const embeddings = await embedDocuments(chunks);
  await collection.add({
    ids: chunks.map((_, i) => `chunk-${i}`),
    documents: chunks,
    embeddings,
    metadatas: chunks.map((c) => ({ source: "price-list.pdf", section: c.split("\n")[0] })),
  });
  console.log("[rag] ingest complete");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ingest({ force: process.argv.includes("--force") }).then(() => process.exit(0));
}
