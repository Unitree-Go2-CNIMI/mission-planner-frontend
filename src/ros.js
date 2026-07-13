import * as ROSLIB from "roslib";

const ROSBRIDGE_URL = `ws://${window.location.hostname}:9090`;
const RECONNECT_DELAY_MS = 2000;

export const ros = new ROSLIB.Ros({
  url: ROSBRIDGE_URL,
});

// ---------------- CONNECTION STATUS ----------------
// "connecting" | "connected" | "reconnecting" | "error"
let connectionStatus = "connecting";
const connectionListeners = new Set();

function setConnectionStatus(status) {
  connectionStatus = status;
  connectionListeners.forEach((cb) => cb(status));
}

export function getConnectionStatus() {
  return connectionStatus;
}

export function subscribeConnectionStatus(cb) {
  connectionListeners.add(cb);
  return () => connectionListeners.delete(cb);
}

let reconnectTimer = null;

function scheduleReconnect() {
  if (reconnectTimer) return;
  setConnectionStatus("reconnecting");
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    ros.connect(ROSBRIDGE_URL);
  }, RECONNECT_DELAY_MS);
}

ros.on("connection", () => {
  console.log("ROS connected");
  setConnectionStatus("connected");
});

ros.on("error", (err) => {
  console.log("ROS error:", err);
  setConnectionStatus("error");
  scheduleReconnect();
});

ros.on("close", () => {
  console.log("ROS connection closed");
  scheduleReconnect();
});

export const robotPoseTopic = new ROSLIB.Topic({
  ros,
  name: "/amcl_pose",
  messageType: "geometry_msgs/PoseWithCovarianceStamped",
});

export const lowStateTopic = new ROSLIB.Topic({
  ros,
  name: "/lowstate",
  messageType: "unitree_go/msg/LowState",
  throttle_rate: 200,
});

export const planTopic = new ROSLIB.Topic({
  ros,
  name: "/plan",
  messageType: "nav_msgs/Path",
});