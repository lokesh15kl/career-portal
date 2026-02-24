export default function ErrorBanner({ message, type = "error", onClose, showClose = true }) {
  const styles = {
    container: {
      padding: "12px 14px",
      borderRadius: 10,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 16,
      ...getStylesByType(type)
    },
    content: {
      flex: 1
    },
    closeBtn: {
      flex: "0 0 auto",
      width: 24,
      height: 24,
      border: "none",
      background: "transparent",
      fontSize: 20,
      cursor: "pointer",
      padding: 0,
      display: showClose ? "block" : "none"
    }
  };

  const typeStyles = getStylesByType(type);

  return (
    <div style={styles.container}>
      <p style={{ ...styles.content, margin: 0, ...typeStyles.text }}>
        {message}
      </p>
      {onClose && showClose && (
        <button onClick={onClose} style={{ ...styles.closeBtn, color: typeStyles.text.color }}>
          ×
        </button>
      )}
    </div>
  );
}

function getStylesByType(type) {
  switch (type) {
    case "warning":
      return {
        bg: "#fff3cd",
        border: "1px solid #ffc107",
        text: { color: "#856404" }
      };
    case "error":
      return {
        bg: "#f8d7da",
        border: "1px solid #f5c6cb",
        text: { color: "#721c24" }
      };
    case "success":
      return {
        bg: "#d4edda",
        border: "1px solid #c3e6cb",
        text: { color: "#155724" }
      };
    case "info":
      return {
        bg: "#d1ecf1",
        border: "1px solid #bee5eb",
        text: { color: "#0c5460" }
      };
    default:
      return {
        bg: "#f8d7da",
        border: "1px solid #f5c6cb",
        text: { color: "#721c24" }
      };
  }
}
