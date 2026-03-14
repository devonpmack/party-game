import {
  insertCoin,
  onPlayerJoin,
  myPlayer,
  isHost,
  getState,
  setState,
  getRoomCode,
  type PlayerState,
} from "playroomkit";
import { useGameStore } from "./store";
import { PLAYER_COLORS } from "./constants";

const players: Map<string, PlayerState> = new Map();

export async function initNetwork(): Promise<void> {
  await insertCoin({ maxPlayersPerRoom: 8 });

  const me = myPlayer();
  if (me) {
    useGameStore.getState().setMyId(me.id);
  }

  onPlayerJoin((player) => {
    players.set(player.id, player);
    syncPlayerList();

    player.onQuit(() => {
      players.delete(player.id);
      syncPlayerList();
    });
  });
}

function syncPlayerList(): void {
  let i = 0;
  const infos = Array.from(players.values()).map((p) => {
    const profile = p.getProfile();
    const hex = profile.color?.hex;
    const color = hex != null
      ? `#${hex.toString(16).padStart(6, "0")}`
      : PLAYER_COLORS[i % PLAYER_COLORS.length];
    i++;
    return {
      id: p.id,
      name: profile.name ?? "Player",
      color,
    };
  });
  useGameStore.getState().setPlayers(infos);
}

export function getPlayers(): Map<string, PlayerState> {
  return players;
}

export function getPlayerById(id: string): PlayerState | undefined {
  return players.get(id);
}

export { myPlayer, isHost, getState, setState, getRoomCode };
export type { PlayerState };
