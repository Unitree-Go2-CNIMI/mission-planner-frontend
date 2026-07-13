const POSE_FIELDS = ["x", "y", "z", "qx", "qy", "qz", "qw"];

// Validates a mission before it is sent to ROS. `isFreeSpace` and `grid`
// are passed in so this reuses the same obstacle-checking logic used
// when placing stations on the map.
export function validateMission(mission, { grid, isFreeSpace, minDistance, taskTypes }) {
  const errors = [];

  if (!mission) {
    return { valid: false, errors: ["No mission selected"] };
  }

  if (!mission.id) {
    errors.push("Mission is missing an id");
  }

  if (!mission.name || !mission.name.trim()) {
    errors.push("Mission name is empty");
  }

  if (!Array.isArray(mission.stations) || mission.stations.length === 0) {
    errors.push("Mission has no stations");
    return { valid: false, errors };
  }

  const seenIds = new Set();

  mission.stations.forEach((station, i) => {
    const label = `Station ${i + 1}`;

    if (!station.id) {
      errors.push(`${label}: missing id`);
    } else if (seenIds.has(station.id)) {
      errors.push(`${label}: duplicate station id`);
    } else {
      seenIds.add(station.id);
    }

    const pose = station.pose;
    if (!pose) {
      errors.push(`${label}: missing pose`);
      return;
    }

    for (const field of POSE_FIELDS) {
      if (typeof pose[field] !== "number" || !Number.isFinite(pose[field])) {
        errors.push(`${label}: pose.${field} is not a valid number`);
      }
    }

    if (
      Number.isFinite(pose.qx) &&
      Number.isFinite(pose.qy) &&
      Number.isFinite(pose.qz) &&
      Number.isFinite(pose.qw)
    ) {
      const norm = Math.sqrt(pose.qx ** 2 + pose.qy ** 2 + pose.qz ** 2 + pose.qw ** 2);
      if (Math.abs(norm - 1) > 1e-3) {
        errors.push(`${label}: orientation quaternion is not normalized`);
      }
    }

    if (
      grid &&
      Number.isFinite(pose.x) &&
      Number.isFinite(pose.y) &&
      !isFreeSpace(pose.x, pose.y, grid)
    ) {
      errors.push(`${label}: position is in an obstacle or unmapped area`);
    }

    (station.tasks || []).forEach((task, ti) => {
      if (!taskTypes.includes(task?.type)) {
        errors.push(`${label}: task ${ti + 1} has unknown type "${task?.type}"`);
      }
    });
  });

  for (let i = 0; i < mission.stations.length; i++) {
    for (let j = i + 1; j < mission.stations.length; j++) {
      const a = mission.stations[i].pose;
      const b = mission.stations[j].pose;

      if (
        a &&
        b &&
        Number.isFinite(a.x) &&
        Number.isFinite(a.y) &&
        Number.isFinite(b.x) &&
        Number.isFinite(b.y)
      ) {
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < minDistance) {
          errors.push(
            `Station ${i + 1} and Station ${j + 1} are too close together (${dist.toFixed(2)}m)`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
