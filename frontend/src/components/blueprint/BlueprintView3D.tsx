import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Room } from './Room';
import { EvidenceMarkers } from './EvidenceMarkers';
import { ActorFigures } from './ActorFigures';
import type { BlueprintData, EvidenceItem, ActorData } from './types';

interface BlueprintView3DProps {
  blueprintData: BlueprintData | null;
  evidence?: EvidenceItem[];
  actors?: ActorData[];
  onMarkerClick?: (id: string) => void;
}

/** Loading state shown inside the canvas while data is null */
function LoadingIndicator() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshBasicMaterial color="#3B82F6" wireframe transparent opacity={0.3} />
    </mesh>
  );
}

/** Scene content — lighting, room, evidence, actors */
function SceneContent({
  blueprintData,
  evidence,
  actors,
  onMarkerClick,
}: BlueprintView3DProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.6} castShadow={false} />
      <directionalLight position={[-5, 10, -5]} intensity={0.2} />

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
      />

      {/* Room or loading */}
      {blueprintData ? (
        <>
          <Room blueprint={blueprintData} />
          {evidence && evidence.length > 0 && (
            <EvidenceMarkers evidence={evidence} onMarkerClick={onMarkerClick} />
          )}
          {actors && actors.length > 0 && (
            <ActorFigures actors={actors} />
          )}
        </>
      ) : (
        <LoadingIndicator />
      )}
    </>
  );
}

export function BlueprintView3D({
  blueprintData,
  evidence,
  actors,
  onMarkerClick,
}: BlueprintView3DProps) {
  // Compute camera position based on room dimensions
  const camX = blueprintData ? blueprintData.dimensions.width / 2 : 4;
  const camZ = blueprintData ? blueprintData.dimensions.depth / 2 : 3;
  const camDist = blueprintData
    ? Math.max(blueprintData.dimensions.width, blueprintData.dimensions.depth) * 1.2
    : 8;

  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
      camera={{
        position: [camX + camDist * 0.5, camDist * 0.7, camZ + camDist * 0.5],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
    >
      <Suspense fallback={<LoadingIndicator />}>
        <SceneContent
          blueprintData={blueprintData}
          evidence={evidence}
          actors={actors}
          onMarkerClick={onMarkerClick}
        />
      </Suspense>
    </Canvas>
  );
}
