import { Router } from "express";
import { deleteChat, postChat } from "../controllers/chat.controller.js";

const router = Router();
const HOUR_MS = 60 * 60 * 1000;
const MESSAGE_LIMIT = 30;
const MAX_MESSAGE_LENGTH = 500;
const requestsByIp = new Map();

function limitChatMessages(req, res, next) {
  const message = req.body?.message;
  if (typeof message === "string" && message.length > MAX_MESSAGE_LENGTH) {
    const caught = new Error("Chat message exceeds 500 characters");
    caught.code = "INVALID_BODY";
    return next(caught);
  }

  if (typeof message !== "string" || !message.trim()) return next();

  const now = Date.now();
  for (const [ip, bucket] of requestsByIp) {
    if (bucket.resetAt <= now) requestsByIp.delete(ip);
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  let bucket = requestsByIp.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + HOUR_MS };
    requestsByIp.set(ip, bucket);
  }
  if (bucket.count >= MESSAGE_LIMIT) {
    const caught = new Error("Per-IP chat rate limit exceeded");
    caught.code = "CHAT_RATE_LIMIT";
    return next(caught);
  }

  bucket.count++;
  return next();
}

router.post("/", limitChatMessages, postChat);
router.delete("/:sessionId", deleteChat);

export default router;
