export default function Toolbar({
  hasActiveMission,
  loopCount,
  onLoopCountChange,
  onPauseMission,
  onResumeMission,
  onAbortMission,
  onExecuteMission,
  missionInProgress,
}) {
  return (
    <div style={styles.toolbar}>
      <div style={styles.row}>
        <span style={styles.rowLabel}>Run</span>
        <label style={styles.loopLabel}>
          Loop
          <input
            type="number"
            min={1}
            step={1}
            className="input"
            style={styles.loopInput}
            value={loopCount}
            onChange={(e) => onLoopCountChange(Number(e.target.value))}
            disabled={!hasActiveMission}
          />
        </label>
        <button
          className="btn btn-primary"
          onClick={onExecuteMission}
          disabled={!hasActiveMission || missionInProgress}
        >
          {missionInProgress ? "Mission Running..." : "Execute Mission"}
        </button>
      </div>

      <div style={styles.divider} />

      <div style={styles.row}>
        <span style={styles.rowLabel}>Live</span>
        <button className="btn" onClick={onPauseMission}>
          Pause Mission
        </button>
        <button className="btn" onClick={onResumeMission}>
          Resume Mission
        </button>
        <button className="btn btn-danger" onClick={onAbortMission}>
          Abort Mission
        </button>
      </div>
    </div>
  );
}

const styles = {
  toolbar: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  divider: {
    height: 1,
    background: "var(--border)",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    width: 40,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loopLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0 4px",
    fontSize: 14,
    color: "var(--text-h)",
  },
  loopInput: {
    width: 56,
  },
};
