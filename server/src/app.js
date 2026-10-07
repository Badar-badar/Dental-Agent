import cors from "cors";
import express from "express";
import chatRoutes from "./routes/chat.routes.js";
import { error as logError } from "./utils/logger.js";

const app = express();

app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/chat", chatRoutes);
app.use((caught, _req, res, _next) => {
  logError("server", caught);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

export default app;
