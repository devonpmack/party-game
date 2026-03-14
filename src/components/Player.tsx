import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { Billboard, Text } from "@react-three/drei";
import Ecctrl from "ecctrl";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { getPlayerById } from "../network";
import { PLAYER_SPEED } from "../constants";

interface PlayerProps {
  playerId: string;
  color: string;
  name: string;
  initialPosition: [number, number, number];
}

function CharacterMesh({
  color,
  eliminated,
}: {
  color: string;
  eliminated: boolean;
}) {
  return (
    <group>
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 0.6, 4, 16]} />
        <meshStandardMaterial
          color={color}
          transparent={eliminated}
          opacity={eliminated ? 0.3 : 1}
        />
      </mesh>
      <mesh castShadow position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial
          color={color}
          transparent={eliminated}
          opacity={eliminated ? 0.3 : 1}
        />
      </mesh>
    </group>
  );
}

function PositionSync({
  playerId,
  eliminatedRef,
  setEliminated,
}: {
  playerId: string;
  eliminatedRef: React.MutableRefObject<boolean>;
  setEliminated: (v: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPos.current);
    const player = getPlayerById(playerId);
    if (!player) return;

    player.setState(
      "pos",
      {
        x: worldPos.current.x,
        y: worldPos.current.y,
        z: worldPos.current.z,
      },
      false,
    );

    const isElim = player.getState("eliminated") as boolean;
    if (isElim && !eliminatedRef.current) {
      eliminatedRef.current = true;
      setEliminated(true);
    }
  });

  return <group ref={groupRef} />;
}

export function LocalPlayer({
  playerId,
  color,
  name,
  initialPosition,
}: PlayerProps) {
  const [eliminated, setEliminated] = useState(false);
  const eliminatedRef = useRef(false);

  return (
    <Ecctrl
      position={initialPosition}
      capsuleHalfHeight={0.3}
      capsuleRadius={0.4}
      floatHeight={0.3}
      maxVelLimit={eliminated ? 0 : PLAYER_SPEED}
      turnSpeed={15}
      sprintMult={1.6}
      disableFollowCam
    >
      <PositionSync
        playerId={playerId}
        eliminatedRef={eliminatedRef}
        setEliminated={setEliminated}
      />
      <CharacterMesh color={color} eliminated={eliminated} />
      <Billboard position={[0, 1.4, 0]}>
        <Text
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {name}
        </Text>
      </Billboard>
    </Ecctrl>
  );
}

export function RemotePlayer({
  playerId,
  color,
  name,
  initialPosition,
}: PlayerProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const [eliminated, setEliminated] = useState(false);
  const eliminatedRef = useRef(false);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;
    const player = getPlayerById(playerId);
    if (!player) return;

    const isElim = player.getState("eliminated") as boolean;
    if (isElim && !eliminatedRef.current) {
      eliminatedRef.current = true;
      setEliminated(true);
    }

    const netPos = player.getState("pos") as
      | { x: number; y: number; z: number }
      | undefined;
    if (netPos) {
      const current = body.translation();
      body.setNextKinematicTranslation({
        x: current.x + (netPos.x - current.x) * 0.15,
        y: netPos.y,
        z: current.z + (netPos.z - current.z) * 0.15,
      });
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={initialPosition}
      lockRotations
    >
      <CapsuleCollider args={[0.3, 0.4]} restitution={0.3} friction={0.5} />
      <CharacterMesh color={color} eliminated={eliminated} />
      <Billboard position={[0, 1.4, 0]}>
        <Text
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {name}
        </Text>
      </Billboard>
    </RigidBody>
  );
}
