import { useEffect, useRef, useState } from "react";

const TOOL_LABELS = {
  search_price_list: "Searched price list",
  check_availability: "Checked calendar",
  create_appointment: "Booked in Google Calendar",
};

const STARTERS = [
  "How much is a root canal on a molar?",
  "What are your opening hours?",
  "I'd like to book a cleaning tomorrow",
];

function getSessionId() {
  let id = localStorage.getItem("sessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
  }
  return id;
}

export default function App() {
  const [sessionId, setSessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I'm the BrightSmile assistant. Ask me about prices or book an appointment." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", text: data.reply, tools: [...new Set(data.toolsUsed)] }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    fetch(`/api/chat/${sessionId}`, { method: "DELETE" }).catch(() => {});
    const id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
    setSessionId(id);
    setMessages([{ role: "assistant", text: "New conversation started. How can I help?" }]);
  }

  return (
    <div className="shell">
      <header className="top">
        <div>
          <h1>BrightSmile Dental</h1>
          <p>Prices, hours and appointments</p>
        </div>
        <button className="ghost" onClick={newChat}>New chat</button>
      </header>

      <main className="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`row ${m.role}`}>
            <div className={`bubble ${m.error ? "error" : ""}`}>{m.text}</div>
            {m.tools?.length > 0 && (
              <div className="tools">
                {m.tools.map((t) => (
                  <span key={t} className="chip">{TOOL_LABELS[t] || t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="row assistant">
            <div className="bubble typing"><span /><span /><span /></div>
          </div>
        )}
        {messages.length === 1 && (
          <div className="starters">
            {STARTERS.map((s) => (
              <button key={s} className="ghost" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </main>

      <footer className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Type your message"
          aria-label="Message"
        />
        <button onClick={() => send(input)} disabled={busy || !input.trim()}>Send</button>
      </footer>
    </div>
  );
}
