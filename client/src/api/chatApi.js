/** Send a chat message and return its established { reply, toolsUsed } response. */
export async function sendChatMessage(sessionId, message) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

/** Request deletion of the server-side history for a session. */
export function deleteChatSession(sessionId) {
  return fetch(`/api/chat/${sessionId}`, { method: "DELETE" });
}
