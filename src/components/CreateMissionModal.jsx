export default function CreateMissionModal({
  open,
  name,
  onChangeName,
  onCreate,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div className="card" style={styles.modal}>
        <h3 style={styles.heading}>Create Mission</h3>

        <input
          className="input"
          style={styles.input}
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Mission name"
          autoFocus
        />

        <div style={styles.actions}>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  modal: {
    padding: 24,
    width: 320,
  },
  heading: {
    margin: "0 0 16px",
    fontSize: 17,
  },
  input: {
    width: "100%",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
};
