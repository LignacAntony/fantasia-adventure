"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function GamePage() {
    const params = useParams();
    const gameId = params.id as string;

    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");

    const joinGame = async () => {
        try {
            const response = await fetch(
                `http://localhost:3001/games/${gameId}/users`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erreur");
            }

            setMessage(`Utilisateur créé avec succès !`);
        } catch (err: any) {
            setMessage(err.message);
        }
    };

    return (
        <main style={{ padding: 40 }}>
            <h1>Game ID :</h1>
            <p>{gameId}</p>

            <input
                type="text"
                placeholder="Ton pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <button onClick={joinGame}>Rejoindre</button>

            {message && <p>{message}</p>}
        </main>
    );
}