import { runAgent } from "../services/agent.service.js";
import { deleteSession, loadSession, saveSession } from "../services/session.service.js";
import { error as logError } from "../utils/logger.js";

function getStatus(caught) {
  for (let error = caught; error; error = error.cause) {
    const status = Number(error.status ?? error.statusCode ?? error.response?.status);
    if (Number.isFinite(status)) return status;
  }
  return undefined;
}

function respondWithError(res, caught) {
  logError("server", caught);
  const status = getStatus(caught);
  if (status === 429) {
    return res.status(429).json({
      error: "We're receiving a lot of requests right now. Please try again in a minute.",
      code: "busy",
    });
  }
  if (status === 503) {
    return res.status(503).json({
      error: "The assistant is busy at the moment. Please try again in a minute.",
      code: "busy",
    });
  }
  const fallbackStatus = caught?.code === "INVALID_BODY" ? 400 : 500;
  return res.status(fallbackStatus).json({
    error: "Something went wrong on our side. Please try again.",
    code: fallbackStatus === 400 ? "invalid" : "unknown",
  });
}

/** Validate and process one chat message, preserving the established response shape. */
export async function postChat(req, res) {
  const { sessionId, message } = req.body || {};
  if (!sessionId || typeof message !== "string" || !message.trim()) {
    const caught = new Error("Invalid chat request body");
    caught.code = "INVALID_BODY";
    return respondWithError(res, caught);
  }

  try {
    const { session, contents } = await loadSession(sessionId);
    contents.push({ role: "user", parts: [{ text: message.trim() }] });
    const { reply, toolsUsed } = await runAgent(contents);
    await saveSession(session, contents);
    return res.json({ reply, toolsUsed });
  } catch (caught) {
    return respondWithError(res, caught);
  }
}

/** Delete a chat's persisted conversation history. */
export async function deleteChat(req, res) {
  try {
    await deleteSession(req.params.sessionId);
    return res.json({ ok: true });
  } catch (caught) {
    return respondWithError(res, caught);
  }
}
