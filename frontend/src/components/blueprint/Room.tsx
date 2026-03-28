import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { BlueprintData, Wall, Door, BlueprintWindow, Furniture } from './types';

const WALL_THICKNESS = 0.15;
const WALL_COLOR = '#94A3B8';
const WALL_OPACITY = 0.15;
const FLOOR_COLOR = '#1a2332';
const FURNITURE_COLOR = '#334155';
const WINDOW_COLOR = '#3B82F6';
const WINDOW_OPACITY = 0.25;
const DOOR_FRAME_COLOR = '#F59E0B';

interface RoomProps {
  blueprint: BlueprintData;
}

/** Compute wall length and angle from start/end Vec2 */
function wallMeta(wall: Wall) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const cx = (wall.start.x + wall.end.x) / 2;
  const cz = (wall.start.z + wall.end.z) / 2;
  return { length, angle, cx, cz };
}

/** Check if a point along a wall segment overlaps with a door gap */
function doorGaps(wall: Wall, doors: Door[]): { center: number; halfWidth: number }[] {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (length === 0) return [];

  const gaps: { center: number; halfWidth: number }[] = [];
  for (const door of doors) {
    // Project door position onto the wall line
    const dpx = door.position.x - wall.start.x;
    const dpz = door.position.z - wall.start.z;
    const t = (dpx * dx + dpz * dz) / (length * length);
    // Check proximity to wall line
    const projX = wall.start.x + t * dx;
    const projZ = wall.start.z + t * dz;
    const dist = Math.sqrt(
      (door.position.x - projX) ** 2 + (door.position.z - projZ) ** 2
    );
    if (dist < WALL_THICKNESS * 2 && t >= -0.1 && t <= 1.1) {
      gaps.push({ center: t * length, halfWidth: door.width / 2 });
    }
  }
  return gaps;
}

/** Check if a point along a wall segment overlaps with a window */
function windowPositions(wall: Wall, wallIndex: number, windows: BlueprintWindow[]): { center: number; halfWidth: number; height: number }[] {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (length === 0) return [];

  const result: { center: number; halfWidth: number; height: number }[] = [];
  for (const win of windows) {
    if (win.wallIndex !== wallIndex) continue;
    const dpx = win.position.x - wall.start.x;
    const dpz = win.position.z - wall.start.z;
    const t = (dpx * dx + dpz * dz) / (length * length);
    if (t >= -0.1 && t <= 1.1) {
      result.push({ center: t * length, halfWidth: win.width / 2, height: win.height });
    }
  }
  return result;
}

function WallSegment({
  wall,
  wallIndex,
  doors,
  windows,
}: {
  wall: Wall;
  wallIndex: number;
  doors: Door[];
  windows: BlueprintWindow[];
}) {
  const { length, angle, cx, cz } = wallMeta(wall);

  // Compute door gaps and window positions along this wall
  const gaps = wall.hasDoor ? doorGaps(wall, doors) : [];
  const wins = wall.hasWindow ? windowPositions(wall, wallIndex, windows) : [];

  // Build wall segments by subtracting gaps
  const segments = useMemo(() => {
    // Merge all gaps (doors + windows) sorted by position
    const allGaps = [
      ...gaps.map((g) => ({ start: g.center - g.halfWidth, end: g.center + g.halfWidth, type: 'door' as const })),
      ...wins.map((w) => ({ start: w.center - w.halfWidth, end: w.center + w.halfWidth, type: 'window' as const })),
    ].sort((a, b) => a.start - b.start);

    const segs: { start: number; end: number }[] = [];
    let cursor = 0;
    for (const gap of allGaps) {
      const gapStart = Math.max(0, gap.start);
      const gapEnd = Math.min(length, gap.end);
      if (gapStart > cursor) {
        segs.push({ start: cursor, end: gapStart });
      }
      cursor = Math.max(cursor, gapEnd);
    }
    if (cursor < length) {
      segs.push({ start: cursor, end: length });
    }
    return segs;
  }, [gaps, wins, length]);

  return (
    <group>
      {/* Solid wall segments */}
      {segments.map((seg, i) => {
        const segLen = seg.end - seg.start;
        const segCenter = (seg.start + seg.end) / 2;
        // Position along the wall direction from the wall start
        const offsetFromCenter = segCenter - length / 2;

        return (
          <group
            key={`wall-seg-${i}`}
            position={[cx, wall.height / 2, cz]}
            rotation={[0, -angle, 0]}
          >
            <mesh position={[offsetFromCenter, 0, 0]}>
              <boxGeometry args={[segLen, wall.height, WALL_THICKNESS]} />
              <meshStandardMaterial
                color={WALL_COLOR}
                transparent
                opacity={WALL_OPACITY}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Wireframe overlay */}
            <mesh position={[offsetFromCenter, 0, 0]}>
              <boxGeometry args={[segLen, wall.height, WALL_THICKNESS]} />
              <meshBasicMaterial
                color={WALL_COLOR}
                wireframe
                transparent
                opacity={0.3}
              />
            </mesh>
          </group>
        );
      })}

      {/* Window panels */}
      {wins.map((win, i) => {
        const windowY = wall.height * 0.55; // windows centered at ~55% height
        const offsetFromCenter = win.center - length / 2;
        return (
          <group
            key={`window-${i}`}
            position={[cx, windowY, cz]}
            rotation={[0, -angle, 0]}
          >
            <mesh position={[offsetFromCenter, 0, 0]}>
              <boxGeometry args={[win.halfWidth * 2, win.height, WALL_THICKNESS * 0.5]} />
              <meshStandardMaterial
                color={WINDOW_COLOR}
                transparent
                opacity={WINDOW_OPACITY}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Window frame wireframe */}
            <mesh position={[offsetFromCenter, 0, 0]}>
              <boxGeometry args={[win.halfWidth * 2, win.height, WALL_THICKNESS * 0.5]} />
              <meshBasicMaterial
                color={WINDOW_COLOR}
                wireframe
                transparent
                opacity={0.5}
              />
            </mesh>
          </group>
        );
      })}

      {/* Door frames */}
      {gaps.map((gap, i) => {
        const offsetFromCenter = gap.center - length / 2;
        const doorHeight = Math.min(wall.height, 2.1);
        return (
          <group
            key={`door-${i}`}
            position={[cx, doorHeight / 2, cz]}
            rotation={[0, -angle, 0]}
          >
            <mesh position={[offsetFromCenter, 0, 0]}>
              <boxGeometry args={[gap.halfWidth * 2, doorHeight, WALL_THICKNESS * 0.3]} />
              <meshBasicMaterial
                color={DOOR_FRAME_COLOR}
                wireframe
                transparent
                opacity={0.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function FurnitureItem({ item }: { item: Furniture }) {
  return (
    <group position={[item.position.x, item.dimensions.h / 2, item.position.z]}>
      <mesh>
        <boxGeometry args={[item.dimensions.w, item.dimensions.h, item.dimensions.d]} />
        <meshStandardMaterial
          color={FURNITURE_COLOR}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Wireframe */}
      <mesh>
        <boxGeometry args={[item.dimensions.w, item.dimensions.h, item.dimensions.d]} />
        <meshBasicMaterial
          color={FURNITURE_COLOR}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Label */}
      {item.label && (
        <Text
          position={[0, item.dimensions.h / 2 + 0.15, 0]}
          fontSize={0.12}
          color="#94A3B8"
          anchorX="center"
          anchorY="bottom"
          characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-"
        >
          {item.label.toUpperCase()}
        </Text>
      )}
    </group>
  );
}

export function Room({ blueprint }: RoomProps) {
  const { width, depth } = blueprint.dimensions;

  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={FLOOR_COLOR} side={THREE.DoubleSide} />
      </mesh>

      {/* Grid helper on floor — slightly above to avoid z-fighting */}
      <gridHelper
        args={[Math.max(width, depth) + 2, Math.max(width, depth) + 2, '#253249', '#1C2A40']}
        position={[width / 2, 0.005, depth / 2]}
      />

      {/* Walls */}
      {blueprint.walls.map((wall, i) => (
        <WallSegment
          key={`wall-${i}`}
          wall={wall}
          wallIndex={i}
          doors={blueprint.doors}
          windows={blueprint.windows}
        />
      ))}

      {/* Furniture */}
      {blueprint.furniture.map((item, i) => (
        <FurnitureItem key={`furniture-${i}`} item={item} />
      ))}
    </group>
  );
}
