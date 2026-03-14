import { useEffect, useState } from "react";
import { isHost, getState, setState } from "../network";
import { useGameStore } from "../store";

interface RankingEntry {
  id: string;
  name: string;
  progress: number;
  eliminated: boolean;
}

interface ResultsData {
  winnerId: string | null;
  rankings: RankingEntry[];
}

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

export function Results() {
  const [results, setResults] = useState<ResultsData | null>(null);
  const host = isHost();

  useEffect(() => {
    const r = getState("results") as ResultsData | null;
    setResults(r);
  }, []);

  const handlePlayAgain = () => {
    setState("gameState", "lobby", true);
    useGameStore.getState().setScene("lobby");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 20,
    }}>
      <h1 style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 38,
        fontWeight: 900,
        color: "#ffd700",
        letterSpacing: 4,
      }}>
        ROUND OVER
      </h1>

      {results?.rankings.map((entry, i) => {
        const isWinner = entry.id === results.winnerId;
        const medal = i < 3 ? MEDALS[i] : `${i + 1}.`;

        let color = "#dde0f0";
        if (entry.eliminated) color = "#667788";
        else if (isWinner) color = "#ffd700";

        return (
          <div
            key={entry.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: isWinner ? 24 : 20,
              fontWeight: isWinner ? 700 : 400,
              color,
              padding: "8px 24px",
              borderRadius: 12,
              background: isWinner ? "#ffd70010" : "transparent",
            }}
          >
            <span style={{ fontSize: 28 }}>{medal}</span>
            <span>{entry.name}</span>
            <span style={{ color: "#667799", fontSize: 16 }}>
              {entry.eliminated ? "eliminated" : `${entry.progress}%`}
            </span>
          </div>
        );
      })}

      <div style={{ marginTop: 24 }}>
        {host ? (
          <button
            onClick={handlePlayAgain}
            style={{
              background: "#448aff",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "16px 48px",
              fontSize: 20,
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 1,
              boxShadow: "0 0 30px #448aff44",
            }}
          >
            Play Again
          </button>
        ) : (
          <p style={{ color: "#667799", fontStyle: "italic" }}>
            Waiting for host to start next round...
          </p>
        )}
      </div>
    </div>
  );
}
