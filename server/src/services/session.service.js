import Session from "../models/Session.js";

/** Load or initialize one chat session and parse its stored Gemini history. */
export async function loadSession(sessionId) {
  const session = (await Session.findOne({ sessionId })) || new Session({ sessionId, history: "[]" });
  return { session, contents: JSON.parse(session.history) };
}

/** Persist the updated Gemini history for a chat session. */
export async function saveSession(session, contents) {
  session.history = JSON.stringify(contents);
  await session.save();
}

/** Delete the session associated with the supplied public session ID. */
export async function deleteSession(sessionId) {
  await Session.deleteOne({ sessionId });
}
