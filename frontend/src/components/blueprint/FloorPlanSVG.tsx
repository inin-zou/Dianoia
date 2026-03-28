/**
 * FloorPlanSVG — 2D top-down SVG floor plan rendered from BlueprintData.
 * Coordinate mapping: blueprint x → SVG x, blueprint z → SVG y.
 */
import { useMemo } from 'react';
import type { BlueprintData, EvidenceItem, ActorData, EvidenceAssetType } from './types';

interface FloorPlanSVGProps {
  blueprint: BlueprintData;
  evidence?: EvidenceItem[];
  actors?: ActorData[];
  className?: string;
}

const SCALE = 60; // 1 meter = 60px
const PADDING = 1; // 1 meter padding on each side

const EVIDENCE_COLORS: Record<string, string> = {
  knife: '#EF4444',
  gun: '#EF4444',
  body_outline: '#991B1B',
  blood_marker: '#DC2626',
  fingerprint_marker: '#8B5CF6',
  document_marker: '#3B82F6',
  generic_marker: '#F59E0B',
  clothing: '#F59E0B',
};

const ACTOR_COLORS: Record<string, string> = {
  suspect: '#EF4444',
  victim: '#64748B',
  witness: '#3B82F6',
  officer: '#22C55E',
};

function getEvidenceColor(assetType: EvidenceAssetType | null): string {
  if (!assetType) return EVIDENCE_COLORS.generic_marker;
  return EVIDENCE_COLORS[assetType] ?? EVIDENCE_COLORS.generic_marker;
}

/** Compute the angle of a wall segment in radians */
function wallAngle(sx: number, sz: number, ex: number, ez: number): number {
  return Math.atan2(ez - sz, ex - sx);
}

export function FloorPlanSVG({ blueprint, evidence = [], actors = [], className }: FloorPlanSVGProps) {
  const { dimensions, walls, doors, windows, furniture } = blueprint;

  const viewBox = useMemo(() => {
    const x = -PADDING * SCALE;
    const y = -PADDING * SCALE;
    const w = (dimensions.width + PADDING * 2) * SCALE;
    const h = (dimensions.depth + PADDING * 2) * SCALE;
    return `${x} ${y} ${w} ${h}`;
  }, [dimensions]);

  const svgWidth = (dimensions.width + PADDING * 2) * SCALE;
  const svgHeight = (dimensions.depth + PADDING * 2) * SCALE;

  // Precompute door positions in SVG coords for gap rendering
  const doorGaps = useMemo(() => {
    return doors.map((door) => ({
      cx: door.position.x * SCALE,
      cy: door.position.z * SCALE,
      halfWidth: (door.width / 2) * SCALE,
      label: door.label,
      width: door.width,
    }));
  }, [doors]);

  // Precompute window positions
  const windowItems = useMemo(() => {
    return windows.map((win) => {
      const wall = walls[win.wallIndex];
      if (!wall) return null;
      const angle = wallAngle(wall.start.x, wall.start.z, wall.end.x, wall.end.z);
      const halfW = (win.width / 2) * SCALE;
      const cx = win.position.x * SCALE;
      const cy = win.position.z * SCALE;
      return { cx, cy, halfW, angle };
    }).filter(Boolean) as { cx: number; cy: number; halfW: number; angle: number }[];
  }, [windows, walls]);

  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={{ width: '100%', height: '100%', fontFamily: "'JetBrains Mono', monospace" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid lines at 1m intervals */}
      <g>
        {Array.from({ length: Math.ceil(dimensions.width) + 1 }, (_, i) => (
          <line
            key={`gv-${i}`}
            x1={i * SCALE}
            y1={0}
            x2={i * SCALE}
            y2={dimensions.depth * SCALE}
            stroke="white"
            strokeOpacity={0.05}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: Math.ceil(dimensions.depth) + 1 }, (_, i) => (
          <line
            key={`gh-${i}`}
            x1={0}
            y1={i * SCALE}
            x2={dimensions.width * SCALE}
            y2={i * SCALE}
            stroke="white"
            strokeOpacity={0.05}
            strokeWidth={1}
          />
        ))}
      </g>

      {/* Walls */}
      <g>
        {walls.map((wall, idx) => {
          const x1 = wall.start.x * SCALE;
          const y1 = wall.start.z * SCALE;
          const x2 = wall.end.x * SCALE;
          const y2 = wall.end.z * SCALE;

          // Check if this wall has any doors — if so, render wall segments with gaps
          if (wall.hasDoor) {
            const relevantDoors = doorGaps.filter((dg) => {
              // Check if door center is on this wall segment (within tolerance)
              const wallDx = x2 - x1;
              const wallDy = y2 - y1;
              const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
              if (wallLen === 0) return false;
              // Project door center onto wall line
              const t = ((dg.cx - x1) * wallDx + (dg.cy - y1) * wallDy) / (wallLen * wallLen);
              if (t < -0.01 || t > 1.01) return false;
              const projX = x1 + t * wallDx;
              const projY = y1 + t * wallDy;
              const dist = Math.sqrt((dg.cx - projX) ** 2 + (dg.cy - projY) ** 2);
              return dist < 5; // within 5px tolerance
            });

            if (relevantDoors.length > 0) {
              // Sort doors by their projection parameter on the wall
              const wallDx = x2 - x1;
              const wallDy = y2 - y1;
              const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
              const ux = wallDx / wallLen;
              const uy = wallDy / wallLen;

              const sortedDoors = relevantDoors
                .map((dg) => {
                  const t = ((dg.cx - x1) * ux + (dg.cy - y1) * uy);
                  return { ...dg, t };
                })
                .sort((a, b) => a.t - b.t);

              const segments: { sx: number; sy: number; ex: number; ey: number }[] = [];
              let currentT = 0;

              for (const door of sortedDoors) {
                const gapStart = door.t - door.halfWidth;
                const gapEnd = door.t + door.halfWidth;

                if (gapStart > currentT) {
                  segments.push({
                    sx: x1 + currentT * ux,
                    sy: y1 + currentT * uy,
                    ex: x1 + gapStart * ux,
                    ey: y1 + gapStart * uy,
                  });
                }
                currentT = gapEnd;
              }

              if (currentT < wallLen) {
                segments.push({
                  sx: x1 + currentT * ux,
                  sy: y1 + currentT * uy,
                  ex: x2,
                  ey: y2,
                });
              }

              return (
                <g key={`wall-${idx}`}>
                  {segments.map((seg, si) => (
                    <line
                      key={`wall-${idx}-seg-${si}`}
                      x1={seg.sx}
                      y1={seg.sy}
                      x2={seg.ex}
                      y2={seg.ey}
                      stroke="#F8FAFC"
                      strokeOpacity={0.8}
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              );
            }
          }

          return (
            <line
              key={`wall-${idx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#F8FAFC"
              strokeOpacity={0.8}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Doors — arc showing swing direction */}
      <g>
        {doorGaps.map((dg, idx) => {
          const arcRadius = dg.halfWidth;
          // Draw a small quarter-arc from the door edge
          return (
            <g key={`door-${idx}`}>
              <path
                d={`M ${dg.cx - dg.halfWidth} ${dg.cy} A ${arcRadius} ${arcRadius} 0 0 1 ${dg.cx + dg.halfWidth} ${dg.cy}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="3,2"
                strokeOpacity={0.8}
              />
              <text
                x={dg.cx}
                y={dg.cy + 12}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize={7}
                style={{ textTransform: 'uppercase' as const }}
              >
                {dg.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Windows — dashed blue lines */}
      <g>
        {windowItems.map((win, idx) => {
          const cos = Math.cos(win.angle);
          const sin = Math.sin(win.angle);
          return (
            <line
              key={`win-${idx}`}
              x1={win.cx - win.halfW * cos}
              y1={win.cy - win.halfW * sin}
              x2={win.cx + win.halfW * cos}
              y2={win.cy + win.halfW * sin}
              stroke="#3B82F6"
              strokeOpacity={0.5}
              strokeWidth={3}
              strokeDasharray="6,4"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Furniture — filled rectangles with labels */}
      <g>
        {furniture.map((f, idx) => {
          const cx = f.position.x * SCALE;
          const cy = f.position.z * SCALE;
          const w = f.dimensions.w * SCALE;
          const d = f.dimensions.d * SCALE;
          return (
            <g key={`furn-${idx}`}>
              <rect
                x={cx - w / 2}
                y={cy - d / 2}
                width={w}
                height={d}
                fill="#334155"
                fillOpacity={0.3}
                stroke="#334155"
                strokeOpacity={0.5}
                strokeWidth={1}
                rx={2}
              />
              {f.label && (
                <text
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize={8}
                  style={{ textTransform: 'uppercase' as const }}
                >
                  {f.label}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Evidence markers */}
      <g>
        {evidence.map((e) => {
          if (!e.position) return null;
          const cx = e.position.x * SCALE;
          const cy = e.position.z * SCALE;
          const color = getEvidenceColor(e.assetType);
          const isBody = e.assetType === 'body_outline';

          return (
            <g key={`ev-${e.id}`}>
              {isBody ? (
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={12}
                  ry={6}
                  fill={color}
                  fillOpacity={0.35}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeOpacity={0.8}
                />
              ) : (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={color}
                    fillOpacity={0.4}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeOpacity={0.9}
                  />
                  {/* Outer pulse ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill="none"
                    stroke={color}
                    strokeWidth={0.5}
                    strokeOpacity={0.3}
                  />
                </>
              )}
              <text
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize={7}
                style={{ textTransform: 'uppercase' as const }}
              >
                {e.title}
              </text>
            </g>
          );
        })}
      </g>

      {/* Actors — colored dots with name labels */}
      <g>
        {actors.map((actor) => {
          const cx = actor.position.x * SCALE;
          const cy = actor.position.z * SCALE;
          const color = ACTOR_COLORS[actor.role] ?? actor.color;

          return (
            <g key={`actor-${actor.id}`}>
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill={color}
                fillOpacity={0.6}
                stroke={color}
                strokeWidth={2}
                strokeOpacity={0.9}
              />
              {/* Waypoint path */}
              {actor.waypoints && actor.waypoints.length > 0 && (
                <polyline
                  points={[
                    `${cx},${cy}`,
                    ...actor.waypoints.map((wp) => `${wp.x * SCALE},${wp.z * SCALE}`),
                  ].join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  strokeDasharray="4,3"
                />
              )}
              <text
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                fill={color}
                fontSize={8}
                fontWeight={700}
                style={{ textTransform: 'uppercase' as const }}
              >
                {actor.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Scale bar — bottom-right */}
      <g
        transform={`translate(${dimensions.width * SCALE - 10}, ${dimensions.depth * SCALE + PADDING * SCALE * 0.4})`}
      >
        <line x1={-SCALE} y1={0} x2={0} y2={0} stroke="#94A3B8" strokeWidth={1.5} strokeOpacity={0.6} />
        <line x1={-SCALE} y1={-3} x2={-SCALE} y2={3} stroke="#94A3B8" strokeWidth={1} strokeOpacity={0.6} />
        <line x1={0} y1={-3} x2={0} y2={3} stroke="#94A3B8" strokeWidth={1} strokeOpacity={0.6} />
        <text
          x={-SCALE / 2}
          y={12}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={8}
          fillOpacity={0.6}
        >
          1m
        </text>
      </g>

      {/* Legend — bottom-left */}
      <g transform={`translate(${-PADDING * SCALE * 0.1}, ${dimensions.depth * SCALE + PADDING * SCALE * 0.2})`}>
        {[
          { label: 'WEAPON', color: '#EF4444' },
          { label: 'BODY', color: '#991B1B' },
          { label: 'BLOOD', color: '#DC2626' },
          { label: 'FORENSIC', color: '#8B5CF6' },
          { label: 'DOCUMENT', color: '#3B82F6' },
          { label: 'GENERIC', color: '#F59E0B' },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(0, ${i * 12})`}>
            <circle cx={5} cy={0} r={3} fill={item.color} fillOpacity={0.7} />
            <text x={12} y={3} fill="#94A3B8" fontSize={7} fillOpacity={0.5}>
              {item.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
