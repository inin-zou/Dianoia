import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ActorData } from './types';

const ROLE_COLORS: Record<string, string> = {
  suspect: '#EF4444',
  victim: '#64748B',
  witness: '#3B82F6',
  officer: '#22C55E',
};

const BODY_RADIUS = 0.25;
const BODY_HEIGHT = 1.5;
const HEAD_RADIUS = 0.15;

function ActorFigure({ actor }: { actor: ActorData }) {
  const color = actor.color || ROLE_COLORS[actor.role] || '#F59E0B';

  // Dashed path line on the floor between waypoints
  const pathLine = useMemo(() => {
    if (!actor.waypoints || actor.waypoints.length < 2) return null;
    const points = actor.waypoints.map(
      (wp) => new THREE.Vector3(wp.x, 0.02, wp.z)
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [actor.waypoints]);

  return (
    <group position={[actor.position.x, 0, actor.position.z]}>
      {/* Body capsule — approximated with a cylinder + two half-spheres */}
      <mesh position={[0, BODY_HEIGHT / 2, 0]}>
        <capsuleGeometry args={[BODY_RADIUS, BODY_HEIGHT - BODY_RADIUS * 2, 8, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.7}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Head sphere */}
      <mesh position={[0, BODY_HEIGHT + HEAD_RADIUS, 0]}>
        <sphereGeometry args={[HEAD_RADIUS, 16, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Floating label */}
      <Html
        position={[0, BODY_HEIGHT + HEAD_RADIUS * 2 + 0.3, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${color}40`,
            borderRadius: '3px',
            padding: '2px 6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            fontWeight: 700,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
          }}
        >
          {actor.label}
        </div>
      </Html>

      {/* Floor shadow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.2, 0.35, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dashed movement path */}
      {pathLine && (
        <line geometry={pathLine}>
          <lineDashedMaterial
            color={color}
            dashSize={0.2}
            gapSize={0.1}
            opacity={0.4}
            transparent
          />
        </line>
      )}
    </group>
  );
}

interface ActorFiguresProps {
  actors: ActorData[];
}

export function ActorFigures({ actors }: ActorFiguresProps) {
  return (
    <group>
      {actors.map((actor) => (
        <ActorFigure key={actor.id} actor={actor} />
      ))}
    </group>
  );
}
