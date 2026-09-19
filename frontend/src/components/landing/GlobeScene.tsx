import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const storePositions = [
  { name: 'Mumbai', lat: 19.07, lng: 72.87 },
  { name: 'Delhi', lat: 28.61, lng: 77.2 },
  { name: 'Chennai', lat: 13.08, lng: 80.27 },
];

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Generate continent-like land mass points on the sphere
function generateContinentPoints(radius: number): Float32Array {
  // Approximate continent outlines using lat/lng bounding regions
  const continents = [
    // Asia (rough)
    { latMin: 5, latMax: 55, lngMin: 60, lngMax: 145, density: 0.6 },
    // India specifically (denser)
    { latMin: 8, latMax: 35, lngMin: 68, lngMax: 90, density: 1.2 },
    // Europe
    { latMin: 36, latMax: 70, lngMin: -10, lngMax: 55, density: 0.5 },
    // Africa
    { latMin: -35, latMax: 37, lngMin: -18, lngMax: 52, density: 0.5 },
    // North America
    { latMin: 15, latMax: 72, lngMin: -170, lngMax: -50, density: 0.4 },
    // South America
    { latMin: -56, latMax: 12, lngMin: -82, lngMax: -34, density: 0.4 },
    // Australia
    { latMin: -45, latMax: -10, lngMin: 110, lngMax: 155, density: 0.4 },
  ];

  const points: number[] = [];
  continents.forEach(c => {
    const area = (c.latMax - c.latMin) * (c.lngMax - c.lngMin);
    const count = Math.floor(area * c.density * 0.08);
    for (let i = 0; i < count; i++) {
      const lat = c.latMin + Math.random() * (c.latMax - c.latMin);
      const lng = c.lngMin + Math.random() * (c.lngMax - c.lngMin);
      const v = latLngToVec3(lat, lng, radius + 0.01);
      points.push(v.x, v.y, v.z);
    }
  });
  return new Float32Array(points);
}

// Generate graticule (lat/lng grid lines)
function generateGraticule(radius: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const segments = 64;

  // Latitude lines every 30 degrees
  for (let lat = -60; lat <= 60; lat += 30) {
    for (let i = 0; i <= segments; i++) {
      const lng = (i / segments) * 360 - 180;
      points.push(latLngToVec3(lat, lng, radius + 0.005));
    }
  }

  // Longitude lines every 30 degrees
  for (let lng = -180; lng < 180; lng += 30) {
    for (let i = 0; i <= segments; i++) {
      const lat = (i / segments) * 180 - 90;
      points.push(latLngToVec3(lat, lng, radius + 0.005));
    }
  }

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  });
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

function AtmosphereGlow() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color('#22d3ee') },
    viewVector: { value: new THREE.Vector3(0, 0, 5) },
  }), []);

  const { camera } = useThree();
  useFrame(() => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.viewVector.value = camera.position;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[2.25, 32, 32]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={`
          uniform vec3 viewVector;
          varying float intensity;
          void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 glowColor;
          varying float intensity;
          void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4(glow, intensity * 0.6);
          }
        `}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
      />
    </mesh>
  );
}

function PulsingMarker({ position }: { position: THREE.Vector3 }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    timeRef.current += delta * 2;
    if (ringRef.current) {
      const scale = 1 + Math.sin(timeRef.current) * 0.3;
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 - Math.sin(timeRef.current) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Core dot */}
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* Pulsing ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Vertical beam */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.2, 8]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function ArcPath({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const curveRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  const { curve, tubeGeometry } = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).normalize().multiplyScalar(2.8);
    const c = new THREE.CatmullRomCurve3([start, mid, end]);
    const g = new THREE.TubeGeometry(c, 64, 0.006, 8, false);
    return { curve: c, tubeGeometry: g };
  }, [start, end]);

  useFrame((_, delta) => {
    progressRef.current = (progressRef.current + delta * 0.25) % 1;
    if (curveRef.current) {
      const pos = curve.getPointAt(progressRef.current);
      curveRef.current.position.copy(pos);
    }
    if (trailRef.current) {
      const trailPos = curve.getPointAt(Math.max(0, progressRef.current - 0.05));
      trailRef.current.position.copy(trailPos);
    }
  });

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial color="#22d3ee" opacity={0.15} transparent />
      </mesh>
      {/* Leading dot */}
      <mesh ref={curveRef}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* Trail dot */}
      <mesh ref={trailRef}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Globe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });

  const storePoints = useMemo(() => storePositions.map(s => latLngToVec3(s.lat, s.lng, 2)), []);
  const continentPositions = useMemo(() => generateContinentPoints(2), []);
  const graticuleGeo = useMemo(() => generateGraticule(2), []);

  return (
    <group ref={groupRef}>
      {/* Ocean sphere - dark with subtle sheen */}
      <mesh>
        <sphereGeometry args={[1.99, 64, 64]} />
        <meshPhongMaterial
          color="#040d21"
          emissive="#061525"
          emissiveIntensity={0.3}
          shininess={15}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[2.005, 48, 48]} />
        <meshBasicMaterial color="#22d3ee" wireframe opacity={0.04} transparent />
      </mesh>

      {/* Graticule grid lines */}
      <points geometry={graticuleGeo}>
        <pointsMaterial size={0.008} color="#22d3ee" transparent opacity={0.12} sizeAttenuation />
      </points>

      {/* Continent dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[continentPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color="#22d3ee" transparent opacity={0.45} sizeAttenuation />
      </points>

      {/* Store markers with pulse effect */}
      {storePoints.map((p, i) => (
        <PulsingMarker key={i} position={p} />
      ))}

      {/* Arc paths */}
      {[[0, 1], [1, 2], [0, 2]].map(([a, b], i) => (
        <ArcPath key={i} start={storePoints[a]} end={storePoints[b]} />
      ))}
    </group>
  );
}

function Starfield() {
  const points = useMemo(() => {
    const positions = new Float32Array(4500);
    for (let i = 0; i < 4500; i++) {
      positions[i] = (Math.random() - 0.5) * 40;
    }
    return positions;
  }, []);

  const sizes = useMemo(() => {
    const s = new Float32Array(1500);
    for (let i = 0; i < 1500; i++) {
      s[i] = Math.random() * 0.04 + 0.01;
    }
    return s;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#ffffff" sizeAttenuation transparent opacity={0.5} />
    </points>
  );
}

const GlobeScene = () => (
  <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }}>
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
    <pointLight position={[-5, -3, -5]} intensity={0.3} color="#22d3ee" />
    <Starfield />
    <AtmosphereGlow />
    <Globe />
    <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
  </Canvas>
);

export default GlobeScene;
