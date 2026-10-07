import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import StarterPrompts from "./StarterPrompts.jsx";

/** Render the conversation, loading indicator, and initial prompt suggestions. */
export default function MessageList({ messages, busy, onStarterSelect }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  return (
    <main className="log" aria-live="polite">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
      {busy && (
        <div className="row assistant">
          <div className="bubble typing"><span /><span /><span /></div>
        </div>
      )}
      {messages.length === 1 && <StarterPrompts onSelect={onStarterSelect} />}
      <div ref={endRef} />
    </main>
  );
}
