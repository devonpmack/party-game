import { useState } from "react";
import { isHost, setState, getRoomCode, myPlayer, getPlayers } from "../network";
import { useGameStore } from "../store";
import { START_Z } from "../constants";

export function Lobby() {
  const players = useGameStore((s) => s.players);
  const [copied, setCopied] = useState(false);
  const host = isHost();
  const code = getRoomCode();
  const me = myPlayer();

  const handleStart = () => {
    const playerArray = Array.from(getPlayers().values());
    playerArray.forEach((player, i) => {
      const laneX = (i - (playerArray.length - 1) / 2) * 2.5;
      player.setState("pos", { x: laneX, y: 1, z: START_Z }, true);
      player.setState("prevPos", { x: laneX, y: 1, z: START_Z }, true);
      player.setState("eliminated", false, true);
      player.setState("pendingShot", false, true);
    });
    setState("light", "green", true);
    setState("roundTime", 0, true);
    setState("results", null, true);
    setState("gameState", "playing", true);
    useGameStore.getState().setScene("playing");
  };

  const handleCopy = () => {
    if (!code) return;
    const url = `${location.origin}${location.pathname}#r=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 24,
    }}>
      <h1 style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 48,
        fontWeight: 900,
        letterSpacing: 4,
        background: "linear-gradient(135deg, #fff 0%, #8899bb 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        PARTY GAME
      </h1>

      <p style={{ color: "#8899bb", fontSize: 18 }}>
        {players.length} player{players.length !== 1 ? "s" : ""} connected
        {host ? " (you are host)" : ""}
      </p>

      {code && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <p style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 16,
            color: "#6677aa",
            letterSpacing: 2,
          }}>
            ROOM: {code}
          </p>
          <button
            onClick={handleCopy}
            style={{
              background: "#1e2d4a",
              color: "#7799cc",
              border: "1px solid #334466",
              borderRadius: 8,
              padding: "8px 24px",
              fontSize: 13,
              cursor: "pointer",
              transition: "transform 0.1s",
            }}
          >
            {copied ? "Copied!" : "Copy Invite Link"}
          </button>
        </div>
      )}

      <div style={{
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 500,
        marginTop: 16,
      }}>
        {players.map((p) => (
          <div key={p.id} style={{ textAlign: "center" }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: p.color,
              margin: "0 auto 8px",
              boxShadow: `0 0 20px ${p.color}44`,
            }} />
            <div style={{
              fontSize: 13,
              color: "#dde0f0",
              fontWeight: me?.id === p.id ? 700 : 400,
            }}>
              {p.name}{me?.id === p.id ? " (you)" : ""}
            </div>
          </div>
        ))}
      </div>

      {host && players.length >= 1 && (
        <button
          onClick={handleStart}
          style={{
            background: "#00e676",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "16px 48px",
            fontSize: 20,
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
            marginTop: 16,
            boxShadow: "0 0 30px #00e67644",
            transition: "transform 0.1s",
          }}
        >
          Start Game
        </button>
      )}
    </div>
  );
}
