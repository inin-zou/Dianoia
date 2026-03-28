import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function WireframePlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0xffffff) },
        amplitude: { value: 2.0 },
        frequency: { value: 0.2 },
      },
      vertexShader: `
        uniform float time;
        uniform float amplitude;
        uniform float frequency;
        varying vec2 vUv;
        float noise(vec2 p) {
          return sin(p.x * frequency + time) * cos(p.y * frequency + time) * amplitude;
        }
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z += noise(pos.xy);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 0.4);
        }
      `,
      wireframe: true,
      transparent: true,
    });
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    material.uniforms.time.value = clock.getElapsedTime();
    meshRef.current.rotation.z = clock.getElapsedTime() * 0.05;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[40, 40, 40, 40]} />
    </mesh>
  );
}
