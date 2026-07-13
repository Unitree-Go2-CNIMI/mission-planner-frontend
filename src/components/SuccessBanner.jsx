export default function SuccessBanner({ message }) {
  if (!message) return null;

  return <div style={styles.banner}>{message}</div>;
}

const styles = {
  banner: {
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid var(--success-border)",
    background: "var(--success-bg)",
    color: "var(--success)",
    fontSize: 14,
    fontWeight: 500,
  },
};
