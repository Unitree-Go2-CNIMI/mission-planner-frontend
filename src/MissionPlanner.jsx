// Imports a function that generates unique IDs
import { v4 as uuidv4 } from "uuid";
// Imports a static image file
import mapImage from "./map.png";
// Imports missionROS function
import {
  saveMission,
  deleteMission,
  executeMission,
  abortMission,
  pauseMission,
  resumeMission,
  skipTask,
  fetchMissions,
  startCmdVelBridge,
  stopCmdVelBridge,
} from "./missionROS";
// This imports React core + 3 hooks:
// useState → store data that changes UI
// useRef → store persistent mutable values (no re-render)
// useEffect → run code after render / on lifecycle events
import { useState, useRef, useEffect } from "react";
// Imports ROS subsccriptions (robot current pose from /amcl/pose and occupancy grid)
//Occupancy grid is imported for collision checks between occupied space and
//goal pose
import { robotPoseTopic, lowStateTopic, planTopic } from "./ros";
import { occupancyGridTopic, missionFeedbackTopic } from "./missionROS";

// Loads an image asynchronously
import useImage from "use-image";

import Toolbar from "./components/Toolbar";
import ErrorBanner from "./components/ErrorBanner";
import SuccessBanner from "./components/SuccessBanner";
import MissionList from "./components/MissionList";
import StationList from "./components/StationList";
import MissionFeedbackPanel from "./components/MissionFeedbackPanel";
import ConnectionStatus from "./components/ConnectionStatus";
import MapCanvas from "./components/MapCanvas";
import CreateMissionModal from "./components/CreateMissionModal";
import UnsavedChangesModal from "./components/UnsavedChangesModal";
import { validateMission } from "./missionValidation";

// This defines a React component
export default function MissionPlanner() {
  //missions are current data and setMission is a function to update it
  //Starts as an empty list
  const [missions, setMissions] = useState([]);
  //stores which mission is currently selected
  const [activeMissionId, setActiveMissionId] = useState(null);
  // Whether the active mission can currently be modified (map clicks, tasks,
  // delete waypoint). Only true after the user clicks "Edit" on a mission,
  // or right after creating a new one.
  const [isEditing, setIsEditing] = useState(false);
  // IDs of missions that already exist on disk (loaded from /missions or
  // previously saved this session) — used to label the save button
  const [savedMissionIds, setSavedMissionIds] = useState(new Set());
  //controls if "Create Mission" popup is visible
  const [showModal, setShowModal] = useState(false);
  //text input for new mission name
  const [newMissionName, setNewMissionName] = useState("");
  // It stores mouse position when user clicks and is used to compute desired orientation
  const [dragStart, setDragStart] = useState(null);
  //stores UI error messages
  const [errorMsg, setErrorMsg] = useState("");
  //stores UI success messages
  const [successMsg, setSuccessMsg] = useState("");
  // Dictionary of selected tasks for each station
  const [selectedTasks, setSelectedTasks] = useState({});
  // Dictionary of selected WAIT durations (seconds) for each station
  const [taskDurations, setTaskDurations] = useState({});
  // Number of times to loop the mission when published
  const [loopCount, setLoopCount] = useState(1);
  const [bridgeRunning, setBridgeRunning] = useState(false);
  //List of allowed tasks
  const TASK_TYPES = ["NAVIGATE", "WAIT", "TAKE_PHOTO"];
  // Default duration (seconds) for a new WAIT task
  const DEFAULT_WAIT_DURATION = 2;
  const stageRef = useRef(null);
  // Min distance between stations
  const MIN_DISTANCE = 1.0;
  // Stores occupancy grid
  const [, setGrid] = useState(null);
  const gridRef = useRef(null);
  //stores station ID between mouseDown and mouseUp
  const pendingStationIdRef = useRef(null);
  // Deep snapshot of the active mission taken when editing starts, used to
  // revert ("Discard") if the user switches away without saving
  const editSnapshotRef = useRef(null);
  // Mission switch the user requested while there are unsaved edits —
  // { missionId, makeEditing } | null. Drives <UnsavedChangesModal>.
  const [pendingSwitch, setPendingSwitch] = useState(null);

  // ---------------- LOAD MAP ----------------
  const [map] = useImage(mapImage);
  //map metadata from map.yaml
  const mapMeta = {
    resolution: 0.05,
    origin: [-12.5, -19.55],
  };
  //1 here is used as fallback
  const mapWidth = map?.width || 1;
  const mapHeight = map?.height || 1;
  // Renders the map larger than its native pixel size so it dominates the
  // layout. screenToMap/mapToScreen convert between this display size and
  // the original mapWidth/mapHeight used for resolution math.
  const MAP_DISPLAY_SCALE = 1.8;
  const displayWidth = mapWidth * MAP_DISPLAY_SCALE;
  const displayHeight = mapHeight * MAP_DISPLAY_SCALE;

  //Searches mission list and return currently selected mission
  const activeMission = missions.find((m) => m.id === activeMissionId);

  // ---------------- LOAD SAVED MISSIONS ----------------
  // Retries on a delay if the Flask API isn't reachable yet, so the frontend
  // can be opened before the backend is up and missions still load once it is.
  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    const load = () => {
      fetchMissions().then((loaded) => {
        if (cancelled) return;

        if (loaded === null) {
          retryTimer = setTimeout(load, 2000);
          return;
        }

        setMissions(loaded);
        setSavedMissionIds(new Set(loaded.map((m) => m.id)));
      });
    };

    load();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    //callback function when grid arrives
    const cb = (msg) => {
      console.log("RAW MAP MSG:", msg);
      setGrid(msg);
      gridRef.current = msg;
    };
    //start listening to ROS map updates
    occupancyGridTopic.subscribe(cb);

    return () => {
      occupancyGridTopic.unsubscribe(cb);
    };
  }, []);

  // ---------------- CONVERSIONS ----------------
  const screenToMap = (x, y) => {
    const px = x / MAP_DISPLAY_SCALE;
    const py = y / MAP_DISPLAY_SCALE;
    return {
      x: px * mapMeta.resolution + mapMeta.origin[0],
      y: (mapHeight - py) * mapMeta.resolution + mapMeta.origin[1],
    };
  };

  const mapToScreen = (x, y) => {
    const px = (x - mapMeta.origin[0]) / mapMeta.resolution;
    const py = mapHeight - (y - mapMeta.origin[1]) / mapMeta.resolution;
    return { x: px * MAP_DISPLAY_SCALE, y: py * MAP_DISPLAY_SCALE };
  };

  // ✅ FIX: consistently use grid.info.width / grid.info.height throughout
  const worldToGridIndex = (x, y, grid) => {
    if (!grid) return null;

    const origin = grid.info.origin.position;
    const gx = Math.floor((x - origin.x) / grid.info.resolution);
    const gy = Math.floor((y - origin.y) / grid.info.resolution);

    if (
      gx < 0 ||
      gy < 0 ||
      gx >= grid.info.width ||
      gy >= grid.info.height
    ) {
      return null;
    }

    return gy * grid.info.width + gx;
  };

  const isFreeSpace = (x, y, grid) => {
    const idx = worldToGridIndex(x, y, grid);
    if (idx === null) return false;

    const value = grid.data[idx];
    return Number(value) === 0;
  };

  // Runs the mission validator against the active mission. On failure,
  // shows all the issues found and returns false so callers can bail out.
  const checkMissionValid = () => {
    const { valid, errors } = validateMission(activeMission, {
      grid: gridRef.current,
      isFreeSpace,
      minDistance: MIN_DISTANCE,
      taskTypes: TASK_TYPES,
    });

    if (!valid) {
      setErrorMsg(errors);
      return false;
    }

    setErrorMsg("");
    return true;
  };

  // Saves the active mission, then calls onResult(success) — used both by
  // the per-mission "Save"/"Save Changes" button and by the unsaved-changes
  // modal's "Save" option.
  const saveActiveMission = (onResult) => {
    if (!activeMission || !checkMissionValid()) {
      onResult?.(false);
      return;
    }

    const missionId = activeMission.id;
    saveMission(activeMission, (result) => {
      if (result?.success) {
        setSavedMissionIds((prev) => new Set(prev).add(missionId));
        setIsEditing(false);
        setSuccessMsg("Changes saved");
        setTimeout(() => setSuccessMsg(""), 2000);
      }
      onResult?.(!!result?.success);
    });
  };

  const handleSaveMission = () => saveActiveMission();

  const handleDeleteMission = (missionId) => {
    const mission = missions.find((m) => m.id === missionId);
    const name = mission?.name || missionId;

    if (!window.confirm(`Delete mission "${name}"? This cannot be undone.`)) {
      return;
    }

    const removeLocally = () => {
      setMissions((prev) => prev.filter((m) => m.id !== missionId));
      setSavedMissionIds((prev) => {
        const next = new Set(prev);
        next.delete(missionId);
        return next;
      });

      if (activeMissionId === missionId) {
        setActiveMissionId(null);
        setIsEditing(false);
      }
    };

    // Mission was never saved to disk, so there's nothing to delete on the
    // backend — just drop it from local state.
    if (!savedMissionIds.has(missionId)) {
      removeLocally();
      return;
    }

    deleteMission(missionId, (result) => {
      if (!result?.success) return;
      removeLocally();
    });
  };

  const handleExecuteMission = () => {
    if (!activeMission) return;
    if (anyMissionInProgress) return;
    if (!checkMissionValid()) return;
    executeMission(activeMission.id, loopCount);
  };

  // ---------------- SELECT / EDIT MISSION ----------------
  // Actually switches the active mission, taking/clearing the edit snapshot
  // as needed. Bypasses the unsaved-changes check below.
  const performSwitch = (missionId, makeEditing) => {
    if (makeEditing) {
      const mission = missions.find((m) => m.id === missionId);
      editSnapshotRef.current = mission ? JSON.parse(JSON.stringify(mission)) : null;
    } else {
      editSnapshotRef.current = null;
    }
    setActiveMissionId(missionId);
    setIsEditing(makeEditing);
  };

  // If the user is mid-edit on a *different* mission, ask whether to save or
  // discard those changes before switching. Otherwise switch immediately.
  const requestMissionSwitch = (missionId, makeEditing) => {
    if (isEditing && activeMissionId !== null && activeMissionId !== missionId) {
      setPendingSwitch({ missionId, makeEditing });
      return;
    }
    performSwitch(missionId, makeEditing);
  };

  const handleSelectMission = (missionId) => {
    if (anyMissionInProgress && missionId !== missionFeedback.mission_id) return;
    requestMissionSwitch(missionId, false);
  };

  const handleEditMission = (missionId) => {
    if (anyMissionInProgress) return;
    requestMissionSwitch(missionId, true);
  };

  // ---------------- UNSAVED CHANGES MODAL ----------------
  const handleSaveAndSwitch = () => {
    if (!pendingSwitch) return;
    const { missionId, makeEditing } = pendingSwitch;

    saveActiveMission((success) => {
      if (!success) return;
      setPendingSwitch(null);
      performSwitch(missionId, makeEditing);
    });
  };

  const handleDiscardAndSwitch = () => {
    if (!pendingSwitch) return;

    const snapshot = editSnapshotRef.current;
    if (snapshot) {
      setMissions((prev) => prev.map((m) => (m.id === snapshot.id ? snapshot : m)));
    }

    const { missionId, makeEditing } = pendingSwitch;
    setPendingSwitch(null);
    performSwitch(missionId, makeEditing);
  };

  const handleCancelSwitch = () => setPendingSwitch(null);

  // ---------------- CREATE MISSION ----------------
  const createMission = () => {
    const mission = {
      id: uuidv4(),
      name: newMissionName || "Untitled Mission",
      stations: [],
    };

    setMissions([...missions, mission]);
    editSnapshotRef.current = JSON.parse(JSON.stringify(mission));
    setActiveMissionId(mission.id);
    setIsEditing(true);
    setShowModal(false);
    setNewMissionName("");
  };

  const [robotPose, setRobotPose] = useState(null);
  // Battery state of charge (%) from /lowstate
  const [batteryLevel, setBatteryLevel] = useState(null);

  useEffect(() => {
    //  store cb reference so unsubscribe can properly clean up
    const cb = (msg) => {
      const pose = msg.pose.pose;

      setRobotPose({
        x: pose.position.x,
        y: pose.position.y,
        z: pose.position.z,
        qx: pose.orientation.x,
        qy: pose.orientation.y,
        qz: pose.orientation.z,
        qw: pose.orientation.w,
      });
    };

    robotPoseTopic.subscribe(cb);

    return () => robotPoseTopic.unsubscribe(cb);
  }, []);

  useEffect(() => {
    const cb = (msg) => {
      setBatteryLevel(msg.bms_state.soc);
    };

    lowStateTopic.subscribe(cb);

    return () => lowStateTopic.unsubscribe(cb);
  }, []);

  // Latest /mission_feedback message, used by the feedback panel and to
  // highlight mission progress on the map
  const [missionFeedback, setMissionFeedback] = useState(null);

  useEffect(() => {
    const cb = (msg) => {
      try {
        setMissionFeedback(JSON.parse(msg.data));
      } catch (err) {
        console.error("MissionPlanner: failed to parse mission feedback", err);
      }
    };

    missionFeedbackTopic.subscribe(cb);

    return () => missionFeedbackTopic.unsubscribe(cb);
  }, []);

  // Nav2 global plan, in world coordinates (converted to screen coords at render time)
  const [path, setPath] = useState([]);

  useEffect(() => {
    const cb = (msg) => {
      setPath(msg.poses.map((p) => ({ x: p.pose.position.x, y: p.pose.position.y })));
    };

    planTopic.subscribe(cb);

    return () => planTopic.unsubscribe(cb);
  }, []);
  //Convert received robot pose from map to screen
  const robotScreen = robotPose ? mapToScreen(robotPose.x, robotPose.y) : null;
  //Converts quaternion to radians
  const getYaw = (pose) => {
    return Math.atan2(
      2 * (pose.qw * pose.qz + pose.qx * pose.qy),
      1 - 2 * (pose.qy * pose.qy + pose.qz * pose.qz)
    );
  };
  const robotYaw = robotPose ? getYaw(robotPose) : 0;

  // True while any mission (not necessarily the active one) is executing
  const anyMissionInProgress =
    missionFeedback &&
    !["COMPLETED", "ABORTED", "FAILED", "IDLE"].includes(missionFeedback.state);

  // Index of the station currently being executed, used to highlight
  // mission progress on the map (-1 when no mission is in progress)
  const missionInProgress =
    anyMissionInProgress &&
    activeMission &&
    missionFeedback.mission_id === activeMission.id;

  const currentStationIndex = missionInProgress
    ? activeMission.stations.findIndex((s) => s.id === missionFeedback.station_id)
    : -1;

  // The task currently running at the robot's station, if any. Only
  // WAIT and TAKE_PHOTO have a skippable in-progress duration.
  const currentTaskType =
    currentStationIndex >= 0
      ? activeMission.stations[currentStationIndex]?.tasks?.[0]?.type
      : null;

  const canSkipTask =
    missionFeedback?.state === "TASK" &&
    ["WAIT", "TAKE_PHOTO"].includes(currentTaskType);

  // ---------------- BRIDGE CONTROLS ----------------
  const handleStartBridge = () => {
    startCmdVelBridge((result) => {
      if (result?.success) setBridgeRunning(true);
      else setErrorMsg(result?.message || "Failed to start bridge");
    });
  };

  const handleStopBridge = () => {
    stopCmdVelBridge((result) => {
      if (result?.success) setBridgeRunning(false);
      else setErrorMsg(result?.message || "Failed to stop bridge");
    });
  };

  // ---------------- MISSION CONTROLS ----------------
  const handlePauseMission = () => {
    pauseMission();
  };

  const handleResumeMission = () => {
    resumeMission();
  };

  const handleSkipTask = () => {
    skipTask();
  };

  const handleAbortMission = () => {
    abortMission();
    setPath([]);
  };

  // ---------------- ADD STATION ----------------
  const handleMouseDown = () => {
    // Guard clause: Returns if no mission selected, not in edit mode, the map is not loaded and the occupancy grid is not received yet
    if (!activeMissionId || !isEditing || !map || !gridRef.current) return;

    const stage = stageRef.current;
    //Returns mouse position in pixels
    const pointer = stage.getPointerPosition();
    //Converts it from screen to world
    const world = screenToMap(pointer.x, pointer.y);
    //Checks whether the goal is in free space or no
    if (!isFreeSpace(world.x, world.y, gridRef.current)) {
      setErrorMsg("Invalid waypoint: obstacle or unknown space");
      setTimeout(() => setErrorMsg(""), 2000);
      return;
    }

    // avoids relying on possibly outdated state during async updates?????
    const activeMissionSnapshot = missions.find((m) => m.id === activeMissionId);
    if (activeMissionSnapshot) {
      //Reject stations if too close to another station
      for (let i = 0; i < activeMissionSnapshot.stations.length; i++) {
        const station = activeMissionSnapshot.stations[i];
        const dx = world.x - station.pose.x;
        const dy = world.y - station.pose.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MIN_DISTANCE) {
          setErrorMsg(`Too close to Station ${i + 1}`);
          setTimeout(() => setErrorMsg(""), 2000);
          return;
        }
      }
    }
    //Generates unique ID for the mission
    const newStationId = uuidv4();
    //????????????
    //It stores the ID outside React state.
    // mouseDown happens now
    // mouseUp happens later
    // state may change in between
    pendingStationIdRef.current = newStationId;

    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMissionId) return m;
        //Copy existing stations + add new one
        //Position here are stored without rotation and with an empty tasks list
        return {
          ...m,
          stations: [
            ...m.stations,
            {
              id: newStationId,
              pose: {
                x: world.x,
                y: world.y,
                z: 0,
                qx: 0,
                qy: 0,
                qz: 0,
                qw: 1,
              },
              tasks: [],
            },
          ],
        };
      })
    );
    //Stores initial click position, this position will be updated on mouseUp
    setDragStart(pointer);
  };

  const addTaskToStation = (stationId) => {
    if (!isEditing) return;

    //check dropdown selection for this station, if none, default to wait
    const taskType = selectedTasks[stationId] || TASK_TYPES[0];

    const task = { type: taskType };
    if (taskType === "WAIT") {
      task.duration = taskDurations[stationId] || DEFAULT_WAIT_DURATION;
    }

    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMissionId) return m;

        return {
          ...m,
          stations: m.stations.map((s) => {
            if (s.id !== stationId) return s;

            return {
              ...s,
              tasks: [task],
            };
          }),
        };
      })
    );
  };

  const removeTaskFromStation = (stationId) => {
    if (!isEditing) return;

    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMissionId) return m;

        return {
          ...m,
          stations: m.stations.map((s) => {
            if (s.id !== stationId) return s;

            return {
              ...s,
              tasks: [],
            };
          }),
        };
      })
    );
  };

  // ---------------- ROTATION ----------------
  const handleMouseUp = () => {
    // Triggered when user releases mouse
    //Guard: no start position, no mission, not in edit mode, no station being created
    if (!dragStart || !activeMissionId || !isEditing || !pendingStationIdRef.current) return;
    // Get finzl mouse position
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    // Compute drag direction vector
    const dx = pointer.x - dragStart.x;
    const dy = pointer.y - dragStart.y;
    //negative dy = coordinate system correction (canvas Y inversion

    const yaw = Math.atan2(-dy, dx);
    const qz = Math.sin(yaw / 2);
    const qw = Math.cos(yaw / 2);

    //we modify EXACT station created in mouseDown

    const targetId = pendingStationIdRef.current;
    //Update station orientation
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMissionId) return m;

        return {
          ...m,
          stations: m.stations.map((s) => {
            if (s.id !== targetId) return s; // ✅ FIX: match by ID

            return {
              ...s,
              pose: { ...s.pose, qz, qw },
            };
          }),
        };
      })
    );

    pendingStationIdRef.current = null; // ✅ FIX: clear after use
    setDragStart(null);
  };

  // ---------------- DELETE LAST WAYPOINT ----------------
  const deleteLastWaypoint = () => {
    if (!activeMissionId || !isEditing) return;

    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMissionId) return m;

        return {
          ...m,
          stations: m.stations.slice(0, -1),
        };
      })
    );
  };

  return (
    <div style={styles.page}>
      <header className="card" style={styles.header}>
        <div>
          <h1 style={styles.title}>Mission Planner</h1>
          <p style={styles.subtitle}>Plan, monitor and run robot missions</p>
        </div>
        <div style={styles.headerRight}>
          <button
            className="btn"
            onClick={bridgeRunning ? handleStopBridge : handleStartBridge}
          >
            {bridgeRunning ? "Disable Nav" : "Nav Mode"}
          </button>
          <ConnectionStatus />
        </div>
      </header>

      <div className="card" style={styles.toolbarCard}>
        <Toolbar
          hasActiveMission={!!activeMission}
          loopCount={loopCount}
          onLoopCountChange={setLoopCount}
          onPauseMission={handlePauseMission}
          onResumeMission={handleResumeMission}
          onAbortMission={handleAbortMission}
          onExecuteMission={handleExecuteMission}
          missionInProgress={!!anyMissionInProgress}
        />
      </div>

      <ErrorBanner message={errorMsg} />
      <SuccessBanner message={successMsg} />

      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <div className="card" style={styles.panel}>
            <MissionFeedbackPanel
              batteryLevel={batteryLevel}
              feedback={missionFeedback}
              missions={missions}
              canSkipTask={canSkipTask}
              onSkipTask={handleSkipTask}
            />
          </div>

          <div className="card" style={{ ...styles.panel, ...styles.missionsPanel }}>
            <MissionList
              missions={missions}
              activeMissionId={activeMissionId}
              isEditing={isEditing}
              savedMissionIds={savedMissionIds}
              onSelectMission={handleSelectMission}
              onEditMission={handleEditMission}
              onSaveMission={handleSaveMission}
              onDeleteMission={handleDeleteMission}
              onNewMission={() => setShowModal(true)}
              disableSelection={!!anyMissionInProgress}
              runningMissionId={anyMissionInProgress ? missionFeedback.mission_id : null}
            />
          </div>

          <div className="card" style={{ ...styles.panel, ...styles.stationsPanel }}>
            <StationList
              stations={activeMission?.stations}
              taskTypes={TASK_TYPES}
              selectedTasks={selectedTasks}
              onSelectTask={(stationId, task) =>
                setSelectedTasks((prev) => ({ ...prev, [stationId]: task }))
              }
              taskDurations={taskDurations}
              onDurationChange={(stationId, duration) =>
                setTaskDurations((prev) => ({ ...prev, [stationId]: duration }))
              }
              defaultDuration={DEFAULT_WAIT_DURATION}
              onAddTask={addTaskToStation}
              onRemoveTask={removeTaskFromStation}
              onDeleteWaypoint={deleteLastWaypoint}
              canDeleteWaypoint={isEditing && !!activeMission?.stations?.length}
            />
          </div>
        </div>

        <div className="card" style={styles.mapCard}>
          <MapCanvas
            stageRef={stageRef}
            map={map}
            mapWidth={displayWidth}
            mapHeight={displayHeight}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            robotScreen={robotScreen}
            robotYaw={robotYaw}
            stations={activeMission?.stations}
            mapToScreen={mapToScreen}
            path={path}
            currentStationIndex={currentStationIndex}
          />
        </div>
      </div>

      <CreateMissionModal
        open={showModal}
        name={newMissionName}
        onChangeName={setNewMissionName}
        onCreate={createMission}
        onCancel={() => setShowModal(false)}
      />

      <UnsavedChangesModal
        open={!!pendingSwitch}
        missionName={activeMission?.name}
        onSave={handleSaveAndSwitch}
        onDiscard={handleDiscardAndSwitch}
        onCancel={handleCancelSwitch}
      />
    </div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  page: {
    maxWidth: 1600,
    margin: "0 auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 22,
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    fontWeight: 400,
    color: "var(--text)",
  },
  toolbarCard: {
    padding: 16,
  },
  layout: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  sidebar: {
    width: 320,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  panel: {
    padding: 16,
  },
  missionsPanel: {
    maxHeight: 240,
    overflowY: "auto",
    flexShrink: 0,
  },
  stationsPanel: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },
  mapCard: {
    flex: 1,
    minWidth: 0,
    padding: 16,
    overflow: "auto",
  },
};
