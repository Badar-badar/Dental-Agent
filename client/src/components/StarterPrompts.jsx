import { STARTERS } from "../constants/toolLabels.js";

/** Render the starter prompts shown at the beginning of a conversation. */
export default function StarterPrompts({ onSelect }) {
  return (
    <div className="starters">
      {STARTERS.map((starter) => (
        <button key={starter} className="ghost" onClick={() => onSelect(starter)}>{starter}</button>
      ))}
    </div>
  );
}
