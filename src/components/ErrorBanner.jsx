export default function ErrorBanner({ message }) {
  if (!message || (Array.isArray(message) && message.length === 0)) return null;

  if (Array.isArray(message)) {
    return (
      <div style={styles.banner}>
        {message.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  }

  return <div style={styles.banner}>{message}</div>;
}

const styles = {
  banner: {
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid var(--danger-border)",
    background: "var(--danger-bg)",
    color: "var(--danger)",
    fontSize: 14,
    fontWeight: 500,
  },
};
