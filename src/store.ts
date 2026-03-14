import { create } from "zustand";

export type SceneType = "lobby" | "playing" | "results";

export interface PlayerInfo {
  id: string;
  name: string;
  color: string;
}

interface GameStore {
  ready: boolean;
  scene: SceneType;
  players: PlayerInfo[];
  myId: string | null;

  setReady: () => void;
  setScene: (scene: SceneType) => void;
  setPlayers: (players: PlayerInfo[]) => void;
  setMyId: (id: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ready: false,
  scene: "lobby",
  players: [],
  myId: null,

  setReady: () => set({ ready: true }),
  setScene: (scene) => set({ scene }),
  setPlayers: (players) => set({ players }),
  setMyId: (id) => set({ myId: id }),
}));
