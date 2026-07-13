const TASK_LABELS = {
  NAVIGATE: "Navigate",
  WAIT: "Wait",
  TAKE_PHOTO: "Take a Picture",
};

export default function StationList({
  stations,
  taskTypes,
  selectedTasks,
  onSelectTask,
  taskDurations,
  onDurationChange,
  defaultDuration,
  onAddTask,
  onRemoveTask,
  onDeleteWaypoint,
  canDeleteWaypoint,
}) {
  return (
    <div>
      <div style={styles.headerRow}>
        <h3 style={styles.heading}>Stations</h3>
        <button
          className="btn btn-danger"
          style={styles.actionButton}
          onClick={onDeleteWaypoint}
          disabled={!canDeleteWaypoint}
        >
          Delete Added Waypoint
        </button>
      </div>

      {(!stations || stations.length === 0) && (
        <p style={styles.empty}>
          Select a mission and click the map to add stations.
        </p>
      )}

      {stations?.map((s, i) => (
        <div key={s.id} style={styles.stationCard}>
          <div style={styles.stationHeader}>
            <span style={styles.stationName}>Station {i + 1}</span>
            <span style={styles.coords}>
              ({s.pose.x.toFixed(2)}, {s.pose.y.toFixed(2)})
            </span>
          </div>

          {s.tasks?.length > 0 ? (
            <div style={styles.taskList}>
              {s.tasks.map((task, idx) => (
                <span key={idx} style={styles.taskChip}>
                  {TASK_LABELS[task.type] || task.type}
                  {task.type === "WAIT" && ` (${task.duration ?? defaultDuration}s)`}
                  <button
                    className="btn"
                    style={styles.removeTaskButton}
                    onClick={() => onRemoveTask(s.id)}
                    title="Remove task"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div style={styles.taskRow}>
              <select
                className="select"
                style={styles.taskSelect}
                value={selectedTasks[s.id] || taskTypes[0]}
                onChange={(e) => onSelectTask(s.id, e.target.value)}
              >
                {taskTypes.map((task) => (
                  <option key={task} value={task}>
                    {TASK_LABELS[task] || task}
                  </option>
                ))}
              </select>

              {(selectedTasks[s.id] || taskTypes[0]) === "WAIT" && (
                <input
                  className="input"
                  style={styles.durationInput}
                  type="number"
                  min="0"
                  step="0.5"
                  title="Wait duration (seconds)"
                  value={taskDurations[s.id] ?? defaultDuration}
                  onChange={(e) => onDurationChange(s.id, Number(e.target.value))}
                />
              )}

              <button className="btn" onClick={() => onAddTask(s.id)}>
                Add Task
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  heading: {
    margin: 0,
    fontSize: 15,
  },
  actionButton: {
    flexShrink: 0,
    padding: "2px 8px",
    fontSize: 12,
  },
  empty: {
    margin: 0,
    fontSize: 13,
    color: "var(--text)",
  },
  stationCard: {
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  stationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  stationName: {
    fontWeight: 600,
    color: "var(--text-h)",
  },
  coords: {
    fontSize: 12,
    color: "var(--text)",
  },
  taskRow: {
    display: "flex",
    gap: 6,
  },
  taskSelect: {
    flex: 1,
  },
  durationInput: {
    width: 64,
    flexShrink: 0,
  },
  taskList: {
    marginTop: 8,
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  taskChip: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 500,
    padding: "3px 8px",
    borderRadius: 999,
    background: "var(--accent-bg)",
    color: "var(--accent)",
  },
  removeTaskButton: {
    flexShrink: 0,
    padding: "0 4px",
    fontSize: 12,
    lineHeight: 1,
    border: "none",
    background: "transparent",
    color: "var(--accent)",
  },
};
