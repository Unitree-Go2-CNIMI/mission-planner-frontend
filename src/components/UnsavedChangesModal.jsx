export default function UnsavedChangesModal({
  open,
  missionName,
  onSave,
  onDiscard,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div className="card" style={styles.modal}>
        <h3 style={styles.heading}>Unsaved Changes</h3>

        <p style={styles.message}>
          "{missionName}" has unsaved changes. Do you want to save them before switching missions?
        </p>

        <div style={styles.actions}>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onDiscard}>
            Discard
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  modal: { padding: 24, width: 360 },
  heading: { margin: "0 0 16px", fontSize: 17 },
  message: { margin: "0 0 16px", fontSize: 14 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 },
};
