import { useEffect, useState } from "react";
import { getConnectionStatus, subscribeConnectionStatus } from "../ros";
import StatusBadge from "./StatusBadge";

const STATUS_CONFIG = {
  connected: { label: "ROS Connected", bg: "#dcfce7", fg: "#15803d" },
  connecting: { label: "Connecting...", bg: "#fef9c3", fg: "#b45309" },
  reconnecting: { label: "Reconnecting...", bg: "#fef9c3", fg: "#b45309" },
  error: { label: "ROS Disconnected", bg: "#fee2e2", fg: "#b91c1c" },
};

export default function ConnectionStatus() {
  const [status, setStatus] = useState(getConnectionStatus());

  useEffect(() => {
    return subscribeConnectionStatus(setStatus);
  }, []);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.connecting;

  return <StatusBadge {...config} />;
}
