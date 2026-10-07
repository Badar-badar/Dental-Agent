import { TOOL_LABELS } from "../constants/toolLabels.js";

/** Render one chat message and any tool-use chips returned by the API. */
export default function MessageBubble({ message }) {
  return (
    <div className={`row ${message.role}`}>
      <div className="bubble">{message.text}</div>
      {message.tools?.length > 0 && (
        <div className="tools">
          {message.tools.map((tool) => (
            <span key={tool} className="chip">{TOOL_LABELS[tool] || tool}</span>
          ))}
        </div>
      )}
    </div>
  );
}
