/** Render the clinic heading and the new-chat action. */
export default function ChatHeader({ onNewChat }) {
  return (
    <header className="top">
      <div>
        <h1>BrightSmile Dental</h1>
        <p>Prices, hours and appointments</p>
      </div>
      <button className="ghost" onClick={onNewChat}>New chat</button>
    </header>
  );
}
