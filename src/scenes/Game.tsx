import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../store";
import { isHost, getState, setState, getPlayers, getPlayerById } from "../network";
import { Track } from "../components/Track";
import { LocalPlayer, RemotePlayer } from "../components/Player";
import { HUD } from "../components/HUD";
import {
  FINISH_Z,
  START_Z,
  ROUND_DURATION,
  PHASE_MIN,
  PHASE_MAX,
  ELIMINATION_THRESHOLD,
} from "../constants";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
  { name: "rightward", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "run", keys: ["Shift"] },
];

function randomPhaseLength(): number {
  return PHASE_MIN + Math.random() * (PHASE_MAX - PHASE_MIN);
}

export function Game() {
  const players = useGameStore((s) => s.players);
  const myId = useGameStore((s) => s.myId);

  return (
    <KeyboardControls map={keyboardMap}>
      <div style={{ position: "fixed", inset: 0 }}>
        <Canvas shadows>
          <color attach="background" args={["#0d0d1a"]} />
          <fog attach="fog" args={["#0d0d1a", 80, 120]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[5, 20, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={70}
            shadow-camera-bottom={-5}
          />
          <Physics gravity={[0, -9.81, 0]}>
            <Track />
            {players.map((p, i) => {
              const laneX = (i - (players.length - 1) / 2) * 2.5;
              const isLocal = p.id === myId;
              if (isLocal) {
                return (
                  <LocalPlayer
                    key={p.id}
                    playerId={p.id}
                    color={p.color}
                    name={p.name}
                    initialPosition={[laneX, 2, START_Z]}
                  />
                );
              }
              return (
                <RemotePlayer
                  key={p.id}
                  playerId={p.id}
                  color={p.color}
                  name={p.name}
                  initialPosition={[laneX, 1, START_Z]}
                />
              );
            })}
          </Physics>
          <TopDownCamera />
          <TrafficLight />
          <EliminationProjectiles />
          <HostGameLogic />
        </Canvas>
        <HUD />
      </div>
    </KeyboardControls>
  );
}

function TopDownCamera() {
  const myId = useGameStore((s) => s.myId);
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const smoothLook = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame((state, delta) => {
    if (!myId) return;
    const player = getPlayerById(myId);
    if (!player) return;
    const pos = player.getState("pos") as
      | { x: number; y: number; z: number }
      | undefined;
    if (!pos) return;

    desiredPos.current.set(0, 15, pos.z - 6);
    desiredLook.current.set(0, 0, pos.z + 6);

    const lerpFactor = 1 - Math.exp(-4 * delta);
    if (!initialized.current) {
      state.camera.position.copy(desiredPos.current);
      smoothLook.current.copy(desiredLook.current);
      initialized.current = true;
    } else {
      state.camera.position.lerp(desiredPos.current, lerpFactor);
      smoothLook.current.lerp(desiredLook.current, lerpFactor);
    }
    state.camera.lookAt(smoothLook.current);
  });

  return null;
}

function TrafficLight() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const light = (getState("light") as string) ?? "green";
    const color = light === "green" ? 0x00e676 : 0xff1744;
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.setHex(color);
      mat.emissive.setHex(color);
    }
    if (lightRef.current) {
      lightRef.current.color.setHex(color);
    }
  });

  return (
    <group position={[0, 8, FINISH_Z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#00e676"
          emissive="#00e676"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color="#00e676"
        intensity={80}
        distance={40}
      />
    </group>
  );
}

interface ProjectileData {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  spawnTime: number;
}

const PROJECTILE_SPEED = 25;
const IMPACT_DURATION = 0.4;

function EliminationProjectiles() {
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);
  const knownShots = useRef(new Set<string>());

  useFrame((state) => {
    for (const [id, player] of getPlayers()) {
      if (player.getState("pendingShot") && !knownShots.current.has(id)) {
        knownShots.current.add(id);
        const pos = player.getState("pos") as
          | { x: number; y: number; z: number }
          | undefined;
        if (pos) {
          setProjectiles((prev) => [
            ...prev,
            {
              id,
              start: new THREE.Vector3(pos.x, 15, pos.z + 14),
              end: new THREE.Vector3(pos.x, pos.y ?? 1, pos.z),
              spawnTime: state.clock.elapsedTime,
            },
          ]);
        }
      }
    }
  });

  return (
    <>
      {projectiles.map((p) => (
        <Projectile
          key={p.id}
          start={p.start}
          end={p.end}
          spawnTime={p.spawnTime}
          onComplete={() => {
            if (isHost()) {
              const player = getPlayerById(p.id);
              if (player) player.setState("eliminated", true, true);
            }
            setProjectiles((prev) => prev.filter((x) => x.id !== p.id));
          }}
        />
      ))}
    </>
  );
}

function Projectile({
  start,
  end,
  spawnTime,
  onComplete,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  spawnTime: number;
  onComplete: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const completed = useRef(false);
  const travelDuration = start.distanceTo(end) / PROJECTILE_SPEED;
  const totalDuration = travelDuration + IMPACT_DURATION;

  useFrame((state) => {
    if (completed.current || !groupRef.current) return;
    const elapsed = state.clock.elapsedTime - spawnTime;

    if (elapsed < travelDuration) {
      const t = elapsed / travelDuration;
      groupRef.current.position.lerpVectors(start, end, t);
      groupRef.current.scale.setScalar(1 + 0.3 * Math.sin(t * Math.PI * 6));
    } else {
      const impactT = (elapsed - travelDuration) / IMPACT_DURATION;
      groupRef.current.position.copy(end);
      groupRef.current.scale.setScalar(1 + impactT * 4);
      if (matRef.current) matRef.current.opacity = 1 - impactT;
      if (lightRef.current) lightRef.current.intensity = 60 * (1 - impactT);
    }

    if (elapsed >= totalDuration && !completed.current) {
      completed.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial
          ref={matRef}
          color="#ff1744"
          emissive="#ff1744"
          emissiveIntensity={5}
          transparent
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} color="#ff1744" intensity={60} distance={20} />
    </group>
  );
}

function HostGameLogic() {
  const phaseTimer = useRef(0);
  const nextPhaseAt = useRef(randomPhaseLength());
  const elapsed = useRef(0);
  const gameEnded = useRef(false);

  useFrame((_, delta) => {
    if (!isHost() || gameEnded.current) return;

    elapsed.current += delta;
    phaseTimer.current += delta;

    if (phaseTimer.current >= nextPhaseAt.current) {
      const currentLight = (getState("light") as string) ?? "green";
      const newLight = currentLight === "green" ? "red" : "green";
      setState("light", newLight, true);
      phaseTimer.current = 0;
      nextPhaseAt.current = randomPhaseLength();

      if (newLight === "red") {
        for (const [, player] of getPlayers()) {
          const pos = player.getState("pos");
          if (pos) player.setState("prevPos", pos, true);
        }
      }
    }

    setState("roundTime", elapsed.current, true);

    const light = (getState("light") as string) ?? "green";
    if (light === "red") {
      for (const [, player] of getPlayers()) {
        if (player.getState("eliminated") || player.getState("pendingShot"))
          continue;
        const pos = player.getState("pos") as
          | { x: number; z: number }
          | undefined;
        const prevPos = player.getState("prevPos") as
          | { x: number; z: number }
          | undefined;
        if (!pos || !prevPos) continue;
        const dx = pos.x - prevPos.x;
        const dz = pos.z - prevPos.z;
        if (Math.sqrt(dx * dx + dz * dz) > ELIMINATION_THRESHOLD) {
          player.setState("pendingShot", true, true);
        }
      }
    }

    let winner: string | null = null;
    let bestZ = -1;
    const alive: { id: string; z: number }[] = [];

    for (const [id, player] of getPlayers()) {
      if (player.getState("eliminated") || player.getState("pendingShot"))
        continue;
      const pos = player.getState("pos") as { z: number } | undefined;
      const z = pos?.z ?? 0;
      alive.push({ id, z });
      if (z >= FINISH_Z && z > bestZ) {
        bestZ = z;
        winner = id;
      }
    }

    const timeUp = elapsed.current >= ROUND_DURATION;

    if (winner || timeUp || alive.length === 0) {
      if (!winner && alive.length > 0) {
        alive.sort((a, b) => b.z - a.z);
        winner = alive[0].id;
      }

      const rankings = [];
      for (const [id, player] of getPlayers()) {
        const profile = player.getProfile();
        const pos = player.getState("pos") as { z: number } | undefined;
        const progress = Math.max(
          0,
          ((pos?.z ?? 0) - START_Z) / (FINISH_Z - START_Z),
        );
        rankings.push({
          id,
          name: profile.name ?? "Player",
          progress: Math.round(progress * 100),
          eliminated: !!player.getState("eliminated"),
        });
      }
      rankings.sort((a, b) => {
        if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
        return b.progress - a.progress;
      });

      gameEnded.current = true;
      setState("results", { winnerId: winner, rankings }, true);
      setState("gameState", "results", true);
    }
  });

  return null;
}
