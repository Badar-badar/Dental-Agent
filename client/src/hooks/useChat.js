import { useState } from "react";
import { deleteChatSession, sendChatMessage } from "../api/chatApi.js";

function getSessionId() {
  let id = localStorage.getItem("sessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
  }
  return id;
}

/** Own the chat session, message list, and send/new-chat interactions. */
export function useChat() {
  const [sessionId, setSessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I'm the BrightSmile assistant. Ask me about prices or book an appointment." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((current) => [...current, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    try {
      const data = await sendChatMessage(sessionId, message);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply, tools: [...new Set(data.toolsUsed)] },
      ]);
    } catch (caught) {
      setMessages((current) => [...current, { role: "assistant", text: caught.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    deleteChatSession(sessionId).catch(() => {});
    const id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
    setSessionId(id);
    setMessages([{ role: "assistant", text: "New conversation started. How can I help?" }]);
  }

  return { messages, input, busy, setInput, send, newChat };
}
