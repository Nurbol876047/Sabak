import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

function NeonShape() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.2;
    meshRef.current.rotation.y += delta * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[9, 1.5, 128, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} wireframe={true} />
      </mesh>
    </Float>
  );
}

function NeonParticles() {
  const points = useRef();
  
  useFrame((state, delta) => {
    points.current.rotation.y -= delta * 0.05;
    points.current.rotation.x += delta * 0.02;
  });

  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);
  for(let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 60;
  }

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.15} transparent opacity={0.8} />
    </points>
  );
}

export const Neon3DBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-paper-light">
      <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
        <NeonShape />
        <NeonParticles />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-paper-light/30 to-paper-light pointer-events-none" />
    </div>
  );
};
