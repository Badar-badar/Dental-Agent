import { runAgent } from "../services/agent.service.js";
import { deleteSession, loadSession, saveSession } from "../services/session.service.js";
import { toUserError } from "../utils/errors.js";
import { error as logError } from "../utils/logger.js";

function respondWithError(res, caught) {
  logError("server", caught);
  const { status, code, message } = toUserError(caught);
  return res.status(status).json({ error: message, code });
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
