import { useEffect } from "react";
import { initNetwork, getState } from "./network";
import { useGameStore } from "./store";
import { Lobby } from "./scenes/Lobby";
import { Game } from "./scenes/Game";
import { Results } from "./scenes/Results";

export function App() {
  const ready = useGameStore((s) => s.ready);
  const scene = useGameStore((s) => s.scene);

  useEffect(() => {
    initNetwork().then(() => {
      useGameStore.getState().setReady();
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      const gameState = getState("gameState") as string | undefined;
      const store = useGameStore.getState();
      if (gameState === "playing" && store.scene !== "playing") {
        store.setScene("playing");
      } else if (gameState === "results" && store.scene !== "results") {
        store.setScene("results");
      } else if (gameState === "lobby" && store.scene !== "lobby") {
        store.setScene("lobby");
      }
    }, 100);
    return () => clearInterval(interval);
  }, [ready]);

  if (!ready) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}>
        <p style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 24,
          color: "#667799",
        }}>
          Connecting...
        </p>
      </div>
    );
  }

  switch (scene) {
    case "playing":
      return <Game />;
    case "results":
      return <Results />;
    default:
      return <Lobby />;
  }
}
