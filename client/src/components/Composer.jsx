/** Render the message input and send action. */
export default function Composer({ input, busy, onInputChange, onSend }) {
  return (
    <footer className="composer">
      <input
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSend(input)}
        placeholder="Type your message"
        aria-label="Message"
      />
      <button onClick={() => onSend(input)} disabled={busy || !input.trim()}>Send</button>
    </footer>
  );
}
