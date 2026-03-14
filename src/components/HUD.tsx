import { useEffect, useState } from "react";
import { getState, myPlayer } from "../network";
import { ROUND_DURATION } from "../constants";

export function HUD() {
  const [light, setLight] = useState("green");
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [eliminated, setEliminated] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const l = (getState("light") as string) ?? "green";
      setLight(l);

      const roundTime = (getState("roundTime") as number) ?? 0;
      setTimer(Math.max(0, ROUND_DURATION - roundTime));

      const me = myPlayer();
      if (me) {
        setEliminated(!!me.getState("eliminated"));
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const isGreen = light === "green";
  const lightColor = isGreen ? "#00e676" : "#ff1744";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      {/* Light indicator */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 20,
          gap: 8,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: lightColor,
            boxShadow: `0 0 40px ${lightColor}88, 0 0 80px ${lightColor}44`,
            transition: "background 0.15s, box-shadow 0.15s",
          }}
        />
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: lightColor,
            letterSpacing: 3,
            textShadow: `0 0 10px ${lightColor}88`,
            transition: "color 0.15s",
          }}
        >
          {isGreen ? "GREEN LIGHT" : "RED LIGHT"}
        </span>
      </div>

      {/* Timer */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          fontSize: 18,
          color: "#667799",
        }}
      >
        {Math.ceil(timer)}s
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 13,
          color: "#445566",
          fontFamily: "'Inter', sans-serif",
          fontStyle: "italic",
        }}
      >
        WASD to move &middot; Mouse to look &middot; Move during RED and get
        shot
      </div>

      {/* Eliminated overlay */}
      {eliminated && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 56,
            fontWeight: 900,
            color: "#ff1744",
            textShadow: "0 0 40px #ff1744aa, 0 0 80px #ff174466",
            letterSpacing: 8,
          }}
        >
          SHOT!
        </div>
      )}
    </div>
  );
}
