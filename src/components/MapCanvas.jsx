import React from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Circle,
  Text as KonvaText,
  Arrow,
  Line,
} from "react-konva";

export default function MapCanvas({
  stageRef,
  map,
  mapWidth,
  mapHeight,
  onMouseDown,
  onMouseUp,
  robotScreen,
  robotYaw,
  stations,
  mapToScreen,
  path,
  currentStationIndex = -1,
}) {
  const pathPoints = path?.flatMap((p) => {
    const screen = mapToScreen(p.x, p.y);
    return [screen.x, screen.y];
  });

  return (
    <div>
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "#22c55e" }} /> Robot
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "red" }} /> Pending station
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "#2563eb" }} /> Current station
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "#9ca3af" }} /> Completed station
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "orange" }} /> Planned path
        </span>
      </div>

      <div style={styles.stageWrap}>
        <Stage
          ref={stageRef}
          width={mapWidth}
          height={mapHeight}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          <Layer>
            {map && <KonvaImage image={map} width={mapWidth} height={mapHeight} />}

            {pathPoints?.length >= 4 && (
              <Line points={pathPoints} stroke="orange" strokeWidth={2} tension={0.3} />
            )}

            {robotScreen && (
              <React.Fragment>
                <Circle
                  x={robotScreen.x}
                  y={robotScreen.y}
                  radius={5}
                  fill="green"
                  stroke="black"
                  strokeWidth={2}
                />
                <Arrow
                  x={robotScreen.x}
                  y={robotScreen.y}
                  points={[0, 0, 20, 0]}
                  rotation={(-robotYaw * 180) / Math.PI}
                  fill="green"
                  stroke="green"
                  strokeWidth={2}
                />
              </React.Fragment>
            )}

            {stations?.map((s, i) => {
              const screen = mapToScreen(s.pose.x, s.pose.y);
              const yaw = 2 * Math.atan2(s.pose.qz, s.pose.qw);

              const isCompleted = currentStationIndex >= 0 && i < currentStationIndex;
              const isCurrent = i === currentStationIndex;
              const stationColor = isCurrent ? "#2563eb" : isCompleted ? "#9ca3af" : "red";
              const arrowColor = isCurrent ? "#2563eb" : isCompleted ? "#9ca3af" : "blue";

              return (
                <React.Fragment key={s.id}>
                  {isCurrent && (
                    <Circle
                      x={screen.x}
                      y={screen.y}
                      radius={10}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dash={[4, 3]}
                    />
                  )}

                  <Circle x={screen.x} y={screen.y} radius={5} fill={stationColor} />

                  <KonvaText
                    x={screen.x + 8}
                    y={screen.y - 8}
                    text={`ST ${i + 1}`}
                    fontSize={12}
                    fill="black"
                    fontStyle="bold"
                  />

                  <Arrow
                    x={screen.x}
                    y={screen.y}
                    points={[0, 0, 25, 0]}
                    rotation={(-yaw * 180) / Math.PI}
                    fill={arrowColor}
                    stroke={arrowColor}
                    strokeWidth={2}
                  />
                </React.Fragment>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

const styles = {
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
    fontSize: 12,
    color: "var(--text)",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  stageWrap: {
    border: "1px solid var(--border)",
    borderRadius: 8,
    overflow: "hidden",
    display: "inline-block",
    lineHeight: 0,
  },
};
