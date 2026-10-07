import mongoose from "mongoose";
import app from "./app.js";
import { config } from "./config/index.js";
import { initAgent } from "./services/agent.service.js";
import { ingest } from "./rag/ingest.js";
import { info, error } from "./utils/logger.js";

async function main() {
  if (!config.geminiKey) throw new Error("GEMINI_API_KEY is not set");
  await mongoose.connect(config.mongoUri);
  await ingest();
  await initAgent();
  app.listen(config.port, "0.0.0.0", () => info("server", `listening on :${config.port}`));
}

main().catch((caught) => {
  error("server", caught);
  process.exit(1);
});
