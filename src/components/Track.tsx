import { RigidBody, CuboidCollider } from "@react-three/rapier";
import {
  TRACK_LENGTH,
  TRACK_WIDTH,
  WALL_HEIGHT,
  START_Z,
  FINISH_Z,
} from "../constants";

const WALL_THICKNESS = 0.5;
const HALF_W = TRACK_WIDTH / 2;
const HALF_L = TRACK_LENGTH / 2;

export function Track() {
  return (
    <group>
      {/* Ground */}
      <RigidBody type="fixed" position={[0, -0.25, HALF_L]} friction={1}>
        <CuboidCollider args={[HALF_W, 0.25, HALF_L]} />
        <mesh receiveShadow>
          <boxGeometry args={[TRACK_WIDTH, 0.5, TRACK_LENGTH]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </RigidBody>

      {/* Left wall */}
      <RigidBody
        type="fixed"
        position={[-HALF_W - WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_L]}
      >
        <CuboidCollider args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_L]} />
        <mesh>
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, TRACK_LENGTH]} />
          <meshStandardMaterial color="#2a2a4a" transparent opacity={0.3} />
        </mesh>
      </RigidBody>

      {/* Right wall */}
      <RigidBody
        type="fixed"
        position={[HALF_W + WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_L]}
      >
        <CuboidCollider args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_L]} />
        <mesh>
          <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, TRACK_LENGTH]} />
          <meshStandardMaterial color="#2a2a4a" transparent opacity={0.3} />
        </mesh>
      </RigidBody>

      {/* Back wall (behind start) */}
      <RigidBody type="fixed" position={[0, WALL_HEIGHT / 2, -0.25]}>
        <CuboidCollider args={[HALF_W, WALL_HEIGHT / 2, 0.25]} />
      </RigidBody>

      {/* Start line */}
      <mesh position={[0, 0.01, START_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TRACK_WIDTH, 0.3]} />
        <meshStandardMaterial color="white" transparent opacity={0.3} />
      </mesh>

      {/* Finish line */}
      <mesh position={[0, 0.01, FINISH_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TRACK_WIDTH, 0.4]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: Math.floor(TRACK_LENGTH / 5) + 1 }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.005, i * 5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[TRACK_WIDTH, 0.04]} />
          <meshStandardMaterial color="white" transparent opacity={0.06} />
        </mesh>
      ))}

      {/* Side lane markers */}
      {Array.from({ length: Math.floor(TRACK_LENGTH / 5) + 1 }, (_, i) => (
        <group key={`side-${i}`}>
          <mesh
            position={[-HALF_W + 0.1, 0.005, i * 5]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          >
            <planeGeometry args={[0.04, 1]} />
            <meshStandardMaterial color="white" transparent opacity={0.04} />
          </mesh>
          <mesh
            position={[HALF_W - 0.1, 0.005, i * 5]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          >
            <planeGeometry args={[0.04, 1]} />
            <meshStandardMaterial color="white" transparent opacity={0.04} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
