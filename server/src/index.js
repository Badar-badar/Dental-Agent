import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config.js";
import { initAgent, runAgent } from "./agent.js";
import { ingest } from "./rag/ingest.js";

const Session = mongoose.model(
  "Session",
  new mongoose.Schema({ sessionId: { type: String, unique: true }, history: String }, { timestamps: true })
);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body || {};
  if (!sessionId || !message?.trim()) return res.status(400).json({ error: "sessionId and message are required" });
  try {
    const session = (await Session.findOne({ sessionId })) || new Session({ sessionId, history: "[]" });
    const contents = JSON.parse(session.history);
    contents.push({ role: "user", parts: [{ text: message.trim() }] });

    const { reply, toolsUsed } = await runAgent(contents);

    session.history = JSON.stringify(contents);
    await session.save();
    res.json({ reply, toolsUsed });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.delete("/api/chat/:sessionId", async (req, res) => {
  await Session.deleteOne({ sessionId: req.params.sessionId });
  res.json({ ok: true });
});

async function main() {
  if (!config.geminiKey) throw new Error("GEMINI_API_KEY is not set");
  await mongoose.connect(config.mongoUri);
  await ingest(); // first boot: builds the PDF, embeds it into Chroma
  await initAgent(); // spawns the calendar MCP server
  app.listen(config.port, () => console.log(`[server] listening on :${config.port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
