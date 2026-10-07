import cors from "cors";
import express from "express";
import chatRoutes from "./routes/chat.routes.js";
import { toUserError } from "./utils/errors.js";
import { error as logError } from "./utils/logger.js";

const app = express();

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/chat", chatRoutes);
app.use((caught, _req, res, _next) => {
  logError("server", caught);
  const { status, code, message } = toUserError(caught);
  res.status(status).json({ error: message, code });
});

export default app;
