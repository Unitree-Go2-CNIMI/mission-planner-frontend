const STATE_COLORS = {
  IDLE: { bg: "#e5e4e7", fg: "#4b4b4b" },
  STARTED: { bg: "#dbeafe", fg: "#1d4ed8" },
  NAVIGATING: { bg: "#dbeafe", fg: "#1d4ed8" },
  RUNNING: { bg: "#dbeafe", fg: "#1d4ed8" },
  ARRIVED: { bg: "#dbeafe", fg: "#1d4ed8" },
  TASK: { bg: "#dbeafe", fg: "#1d4ed8" },
  PAUSED: { bg: "#fef9c3", fg: "#b45309" },
  COMPLETED: { bg: "#dcfce7", fg: "#15803d" },
  FAILED: { bg: "#fee2e2", fg: "#b91c1c" },
  ABORTED: { bg: "#fee2e2", fg: "#b91c1c" },
};

function getStateColors(state) {
  return STATE_COLORS[state] || STATE_COLORS.IDLE;
}

function batteryColor(level) {
  if (level == null) return "var(--text-h)";
  if (level <= 20) return "#b91c1c";
  if (level <= 50) return "#b45309";
  return "#15803d";
}

export default function MissionFeedbackPanel({ batteryLevel, feedback, missions, canSkipTask, onSkipTask }) {
  if (!feedback) {
    return (
      <div>
        <div style={styles.header}>
          <h3 style={styles.title}>Mission Feedback</h3>
          <span style={{ ...styles.batteryBadge, color: batteryColor(batteryLevel) }}>
            Battery: {batteryLevel != null ? `${batteryLevel}%` : "--"}
          </span>
        </div>
        <p style={styles.empty}>Waiting for mission feedback...</p>
      </div>
    );
  }

  const {
    mission_id,
    state,
    station_index,
    total_stations,
    station_id,
    task,
    message,
    loop_index,
    loop_count,
  } = feedback;

  const colors = getStateColors(state);
  const progress =
    total_stations > 0
      ? Math.min(100, (station_index / total_stations) * 100)
      : 0;

  const feedbackMission = missions?.find((m) => m.id === mission_id);
  const missionName = feedbackMission?.name || mission_id;

  const stationNumber =
    feedbackMission?.stations?.findIndex((s) => s.id === station_id) ?? -1;
  const stationName = stationNumber >= 0 ? `Station ${stationNumber + 1}` : station_id;

  return (
    <div>
      <div style={styles.header}>
        <h3 style={styles.title}>Mission Feedback</h3>
        <span style={{ ...styles.batteryBadge, color: batteryColor(batteryLevel) }}>
          Battery: {batteryLevel != null ? `${batteryLevel}%` : "--"}
        </span>
        <span
          style={{
            ...styles.badge,
            background: colors.bg,
            color: colors.fg,
          }}
        >
          {state}
        </span>
      </div>

      <div style={styles.progressLabel}>
        Station {station_index} / {total_stations}
        {loop_count > 1 && ` · Loop ${(loop_index ?? 0) + 1} / ${loop_count}`}
      </div>
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progress}%`,
            background: colors.fg,
          }}
        />
      </div>

      <div style={styles.fields}>
        <div style={styles.field}>
          <span style={styles.label}>Mission</span>
          <span style={styles.value}>{missionName}</span>
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Station</span>
          <span style={styles.value}>{stationName}</span>
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Task</span>
          <span style={styles.value}>{task}</span>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {canSkipTask && (
        <button className="btn btn-danger" style={styles.skipButton} onClick={onSkipTask}>
          Skip Task
        </button>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 15,
  },
  badge: {
    fontSize: 12,
    fontWeight: "bold",
    padding: "4px 10px",
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  batteryBadge: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: "auto",
    marginRight: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "var(--text)",
    marginBottom: 4,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "var(--code-bg)",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.3s ease",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
  },
  label: {
    color: "var(--text)",
  },
  value: {
    fontWeight: "bold",
    color: "var(--text-h)",
    wordBreak: "break-all",
    textAlign: "right",
    marginLeft: 12,
  },
  message: {
    marginTop: 12,
    padding: "8px 10px",
    borderRadius: 6,
    background: "var(--danger-bg)",
    color: "var(--danger)",
    fontSize: 13,
  },
  empty: {
    margin: 0,
    fontSize: 14,
    color: "var(--text)",
  },
  skipButton: {
    marginTop: 12,
    width: "100%",
  },
};
