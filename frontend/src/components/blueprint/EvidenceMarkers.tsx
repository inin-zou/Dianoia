import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { EvidenceItem, EvidenceAssetType } from './types';

/** Color per asset type */
const ASSET_COLORS: Record<EvidenceAssetType, string> = {
  knife: '#EF4444',
  body_outline: '#991B1B',
  blood_marker: '#DC2626',
  fingerprint_marker: '#8B5CF6',
  document_marker: '#3B82F6',
  generic_marker: '#F59E0B',
  gun: '#EF4444',
  clothing: '#64748B',
};

/** Render a single evidence marker with the correct geometry */
function MarkerMesh({ assetType }: { assetType: EvidenceAssetType }) {
  switch (assetType) {
    case 'knife':
    case 'gun':
      // Elongated box for weapons
      return (
        <mesh>
          <boxGeometry args={[0.3, 0.06, 0.06]} />
          <meshStandardMaterial
            color={ASSET_COLORS[assetType]}
            emissive={ASSET_COLORS[assetType]}
            emissiveIntensity={0.3}
          />
        </mesh>
      );

    case 'body_outline':
      // Flat rectangle on floor
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[0.6, 1.8]} />
          <meshStandardMaterial
            color={ASSET_COLORS.body_outline}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            emissive={ASSET_COLORS.body_outline}
            emissiveIntensity={0.2}
          />
        </mesh>
      );

    case 'blood_marker':
      // Small disc on floor
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.12, 16]} />
          <meshStandardMaterial
            color={ASSET_COLORS.blood_marker}
            emissive={ASSET_COLORS.blood_marker}
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      );

    case 'fingerprint_marker':
      // Small disc
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.1, 16]} />
          <meshStandardMaterial
            color={ASSET_COLORS.fingerprint_marker}
            emissive={ASSET_COLORS.fingerprint_marker}
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      );

    case 'document_marker':
      // Small upright rectangle
      return (
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.2, 0.28, 0.02]} />
          <meshStandardMaterial
            color={ASSET_COLORS.document_marker}
            emissive={ASSET_COLORS.document_marker}
            emissiveIntensity={0.2}
          />
        </mesh>
      );

    case 'clothing':
      // Small box
      return (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.25, 0.1, 0.2]} />
          <meshStandardMaterial
            color={ASSET_COLORS.clothing}
            emissive={ASSET_COLORS.clothing}
            emissiveIntensity={0.1}
          />
        </mesh>
      );

    case 'generic_marker':
    default:
      // Small cone
      return (
        <mesh position={[0, 0.15, 0]}>
          <coneGeometry args={[0.08, 0.3, 8]} />
          <meshStandardMaterial
            color={ASSET_COLORS.generic_marker}
            emissive={ASSET_COLORS.generic_marker}
            emissiveIntensity={0.3}
          />
        </mesh>
      );
  }
}

/** Pulsing ring effect for newly placed evidence */
function PulseRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (Math.sin(clock.elapsedTime * 3) + 1) / 2;
    const scale = 1 + t * 0.5;
    ref.current.scale.set(scale, scale, 1);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - t);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[0.15, 0.25, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function EvidenceMarker({
  item,
  onClick,
}: {
  item: EvidenceItem;
  onClick?: (id: string) => void;
}) {
  if (!item.position) return null;

  const assetType = item.assetType || 'generic_marker';
  const color = ASSET_COLORS[assetType] || ASSET_COLORS.generic_marker;

  return (
    <group
      position={[item.position.x, item.position.y, item.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(item.id);
      }}
    >
      <MarkerMesh assetType={assetType} />
      <PulseRing color={color} />

      {/* Floating label */}
      <Html
        position={[0, 0.5, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
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
          {item.title}
        </div>
      </Html>
    </group>
  );
}

interface EvidenceMarkersProps {
  evidence: EvidenceItem[];
  onMarkerClick?: (id: string) => void;
}

export function EvidenceMarkers({ evidence, onMarkerClick }: EvidenceMarkersProps) {
  return (
    <group>
      {evidence.map((item) => (
        <EvidenceMarker key={item.id} item={item} onClick={onMarkerClick} />
      ))}
    </group>
  );
}
