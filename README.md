# Mission UI

A React + Vite web interface for planning and executing autonomous missions on the
Unitree Go2 robot.

- **Mission planning :** place waypoints on a live occupancy map by clicking and
  dragging to set position and heading; assign a task to each station (Navigate,
  Wait, Take Photo); save and reload missions across sessions
- **Mission execution :** execute a saved mission with a configurable loop count;
  the robot navigates to each station sequentially and executes its assigned task
- **Live monitoring :** track robot position, Nav2 planned path, current station,
  task state, and battery level in real time during execution
- **Execution control :** pause, resume, abort, or skip the current task at any
  point during a mission run

Please note that this is the frontend part of the [go2_cnimi_ws](https://github.com/Unitree-Go2-CNIMI/go2_cnimi_ws)
project. The backend exposes two interfaces this app connects to: `rosbridge_server`
(WebSocket, port `9090`) for live robot data, and `mission_api` (Flask HTTP, port
`5001`) for mission management and execution control. Both must be running on the
same machine as this dev server.

## Prerequisites

- Node.js ≥ 18

## Setup

```bash
git clone https://github.com/Unitree-Go2-CNIMI/mission-planner-frontend.git
cd mission-ui
npm install
npm run dev
```

