import { runAgent } from "../services/agent.service.js";
import { deleteSession, loadSession, saveSession } from "../services/session.service.js";

/** Validate and process one chat message, preserving the established response shape. */
export async function postChat(req, res, next) {
  const { sessionId, message } = req.body || {};
  if (!sessionId || !message?.trim()) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  try {
    const { session, contents } = await loadSession(sessionId);
    contents.push({ role: "user", parts: [{ text: message.trim() }] });
    const { reply, toolsUsed } = await runAgent(contents);
    await saveSession(session, contents);
    return res.json({ reply, toolsUsed });
  } catch (caught) {
    return next(caught);
  }
}

/** Delete a chat's persisted conversation history. */
export async function deleteChat(req, res, next) {
  try {
    await deleteSession(req.params.sessionId);
    return res.json({ ok: true });
  } catch (caught) {
    return next(caught);
  }
}
