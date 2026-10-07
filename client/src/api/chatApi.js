const API = import.meta.env.VITE_API_URL || "";
const SERVER_UNREACHABLE = "We can't reach the server. Please check your connection and try again.";
const KNOWN_ERROR_CODES = new Set(["busy", "config", "service", "invalid", "rate_limit", "unknown"]);

/** Send a chat message and return its established { reply, toolsUsed } response. */
export async function sendChatMessage(sessionId, message) {
  try {
    const response = await fetch(`${API}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(SERVER_UNREACHABLE);
    }
    if (!response.ok) {
      if (KNOWN_ERROR_CODES.has(data?.code) && typeof data.error === "string") {
        const error = new Error(data.error);
        error.code = data.code;
        throw error;
      }
      const error = new Error("Something went wrong on our side. Please try again.");
      error.code = "unknown";
      throw error;
    }
    return data;
  } catch (caught) {
    if (KNOWN_ERROR_CODES.has(caught.code)) throw caught;
    throw new Error(SERVER_UNREACHABLE);
  }
}

/** Request deletion of the server-side history for a session. */
export function deleteChatSession(sessionId) {
  return fetch(`${API}/api/chat/${sessionId}`, { method: "DELETE" });
}
