export default function StatusBadge({ label, bg, fg }) {
  return (
    <span style={{ ...styles.badge, background: bg, color: fg }}>
      <span style={{ ...styles.dot, background: fg }} />
      {label}
    </span>
  );
}

const styles = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
};
