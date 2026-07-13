import * as ROSLIB from "roslib";
import { ros } from "./ros";

export const occupancyGridTopic = new ROSLIB.Topic({
  ros,
  name: "/map",
  messageType: "nav_msgs/OccupancyGrid",
});

export const missionFeedbackTopic = new ROSLIB.Topic({
  ros,
  name: "/mission_feedback",
  messageType: "std_msgs/String",
});

const MISSION_API_URL = `http://${window.location.hostname}:5001`;

// Returns the array of saved missions, or `null` if the request failed (e.g.
// the Flask API isn't up yet) — `null` lets callers distinguish "couldn't
// reach the backend" from "backend reached, no missions saved" and retry.
export function fetchMissions() {
  return fetch(`${MISSION_API_URL}/missions`)
    .then((res) => res.json())
    .catch((err) => {
      console.error("fetchMissions: request failed", err);
      return null;
    });
}

export function saveMission(mission, callback) {
  if (!mission) {
    console.warn("saveMission: no mission provided, aborting call");
    return;
  }

  console.log("saveMission: saving mission_id =", JSON.stringify(mission.id));

  fetch(`${MISSION_API_URL}/save_mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mission),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result?.success) {
        console.log("Mission saved:", result.message);
      } else {
        console.warn("Failed to save mission:", result);
      }
      callback?.(result);
    })
    .catch((err) => {
      console.error("saveMission: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function deleteMission(missionId, callback) {
  if (!missionId) {
    console.warn("deleteMission: no missionId provided, aborting call");
    return;
  }

  console.log("deleteMission: deleting mission_id =", JSON.stringify(missionId));

  fetch(`${MISSION_API_URL}/delete_mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mission_id: missionId }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result?.success) {
        console.log("Mission deleted:", result.message);
      } else {
        console.warn("Failed to delete mission:", result);
      }
      callback?.(result);
    })
    .catch((err) => {
      console.error("deleteMission: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function executeMission(missionId, loopCount = 1, callback) {
  if (!missionId) {
    console.warn("executeMission: no missionId provided, aborting call");
    return;
  }

  console.log("executeMission: sending mission_id =", JSON.stringify(missionId), "loop_count =", loopCount);

  fetch(`${MISSION_API_URL}/execute_mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mission_id: missionId, loop_count: loopCount }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result?.success) {
        console.log("Mission execution started:", result.message);
      } else {
        console.warn("Failed to execute mission:", result);
      }
      callback?.(result);
    })
    .catch((err) => {
      console.error("executeMission: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function abortMission(callback) {
  console.log("abortMission: sending abort request");

  fetch(`${MISSION_API_URL}/abort_mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((result) => {
      if (result?.success) {
        console.log("Mission abort requested:", result.message);
      } else {
        console.warn("Failed to abort mission:", result);
      }
      callback?.(result);
    })
    .catch((err) => {
      console.error("abortMission: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function pauseMission(callback) {
  console.log("pauseMission: sending pause request");

  fetch(`${MISSION_API_URL}/pause_mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((result) => {
      if (result?.success) {
        console.log("Mission paused:", result.message);
      } else {
        console.warn("Failed to pause mission:", result);
      }
      callback?.(result);
    })
    .catch((err) => {
      console.error("pauseMission: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function resumeMission(callback) {
  console.log("resumeMission: sending resume request");

  fetch(`${MISSION_API_URL}/resume_mission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((result) => {
      if (result?.success) {
        console.log("Mission resumed:", result.message);
      } else {
        console.warn("Failed to resume mission:", result);
      }
      callback?.(result);
    })
    .catch((err) => {
      console.error("resumeMission: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function startCmdVelBridge(callback) {
  fetch(`${MISSION_API_URL}/start_cmd_vel_bridge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((result) => {
      callback?.(result);
    })
    .catch((err) => {
      console.error("startCmdVelBridge: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function stopCmdVelBridge(callback) {
  fetch(`${MISSION_API_URL}/stop_cmd_vel_bridge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((result) => {
      callback?.(result);
    })
    .catch((err) => {
      console.error("stopCmdVelBridge: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

export function skipTask(callback) {
  console.log("skipTask: sending skip request");

  fetch(`${MISSION_API_URL}/skip_task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((result) => {
      if (result?.success) {
        console.log("Task skip requested:", result.message);
      } else {
        console.warn("Failed to skip task:", result);
      }
      callback?.(result);
    })
    .catch((err) => {
      console.error("skipTask: request failed", err);
      callback?.({ success: false, message: String(err) });
    });
}

