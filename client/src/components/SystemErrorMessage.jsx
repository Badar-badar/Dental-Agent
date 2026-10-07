/** Render a safe chat error with an action to retry the last user message. */
export default function SystemErrorMessage({ message, onRetry, retryDisabled }) {
  return (
    <div className="system-error" role="alert">
      <svg
        className="system-error-icon"
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9v5m0-8h.01" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="system-error-text">{message}</span>
      <button type="button" className="system-error-retry" onClick={onRetry} disabled={retryDisabled}>
        Try again
      </button>
    </div>
  );
}
