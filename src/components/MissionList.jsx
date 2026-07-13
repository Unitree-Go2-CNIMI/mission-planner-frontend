export default function MissionList({ missions, activeMissionId, isEditing, savedMissionIds, onSelectMission, onEditMission, onSaveMission, onDeleteMission, onNewMission, disableSelection, runningMissionId }) {
  // Show the mission currently being edited first
  const sortedMissions = [...missions].sort((a, b) => {
    const aEditing = isEditing && a.id === activeMissionId;
    const bEditing = isEditing && b.id === activeMissionId;
    if (aEditing === bEditing) return 0;
    return aEditing ? -1 : 1;
  });

  return (
    <div>
      <div style={styles.headerRow}>
        <h3 style={styles.heading}>Missions</h3>
        <button className="btn" style={styles.actionButton} onClick={onNewMission} disabled={disableSelection}>
          + New Mission
        </button>
      </div>

      {missions.length === 0 && (
        <p style={styles.empty}>No missions yet — create one to get started.</p>
      )}

      {sortedMissions.map((m) => {
        const beingEdited = isEditing && m.id === activeMissionId;
        const locked = disableSelection && m.id !== runningMissionId;

        return (
        <div
          key={m.id}
          className={`list-item${m.id === activeMissionId ? " active" : ""}`}
          onClick={() => !locked && onSelectMission(m.id)}
          style={{
            ...styles.missionCard,
            ...(beingEdited ? styles.missionCardEditing : null),
            ...(locked ? styles.missionCardLocked : null),
          }}
        >
          <span style={styles.missionName}>{m.name}</span>
          <div style={styles.actions}>
            {isEditing && m.id === activeMissionId ? (
              <button
                className="btn btn-primary"
                style={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveMission();
                }}
              >
                {savedMissionIds?.has(m.id) ? "Save Changes" : "Save Mission"}
              </button>
            ) : (
              <button
                className="btn"
                style={styles.actionButton}
                disabled={locked}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMission(m.id);
                }}
              >
                Edit
              </button>
            )}
            <button
              className="btn btn-danger"
              style={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMission(m.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
        );
      })}
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
  empty: {
    margin: 0,
    fontSize: 13,
    color: "var(--text)",
  },
  missionCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    marginBottom: 6,
    fontSize: 14,
  },
  missionCardEditing: {
    borderColor: "var(--editing-border)",
    background: "var(--editing-bg)",
  },
  missionCardLocked: {
    opacity: 0.5,
    cursor: "default",
  },
  missionName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 6,
    flexShrink: 0,
  },
  actionButton: {
    flexShrink: 0,
    padding: "2px 8px",
    fontSize: 12,
  },
};
