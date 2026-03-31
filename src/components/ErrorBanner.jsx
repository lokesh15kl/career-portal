export default function ErrorBanner({ message, type = "error", onClose, showClose = true }) {
  const tone = type === "warning" || type === "success" || type === "info" ? type : "error";

  return (
    <div className={`app-banner app-banner-${tone}`} role="alert" aria-live="polite">
      <p className="app-banner-message">
        {message}
      </p>
      {onClose && showClose && (
        <button type="button" onClick={onClose} className="app-banner-close" aria-label="Close alert">
          ×
        </button>
      )}
    </div>
  );
}
