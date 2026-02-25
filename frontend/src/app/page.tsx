"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createGame = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/games", {
        method: "POST",
      });
      console.log("Response json:", response);
      if (!response.ok) {
        throw new Error("Erreur création game");
      }

      const game = await response.json();

      router.push(`/game/${game.id}`);
    } catch (err) {
      console.error(err);
      alert("Impossible de créer la partie ");
    } finally {
      setLoading(false);
    }
  };

  return (
      <main style={{ padding: 40 }}>
        <h1>Créer une nouvelle partie</h1>
        <button onClick={createGame} disabled={loading}>
          {loading ? "Création..." : "Créer une game"}
        </button>
      </main>
  );
}