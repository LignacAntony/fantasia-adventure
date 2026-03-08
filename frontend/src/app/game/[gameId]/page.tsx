"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, Crown } from "lucide-react";
import { socket } from "@/00_infra/socket/page";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { BadgeClasse } from "@/components/badge-classe";
import { getGame } from "@/lib/api";
import type { Game, Player } from "@/lib/api";
import type { AvatarId } from "@/lib/avatars";
import { AVATARS } from "@/lib/avatars";

type LobbyUpdate = {
  players: Player[];
  hostId: string | null;
};

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [user] = useState<{ userId: string; username: string } | null>(() => {
    const raw = localStorage.getItem("fantasia_user");
    return raw ? JSON.parse(raw) : null;
  });

  // Redirect if no user — carry the gameId so the join modal auto-opens
  useEffect(() => {
    if (!user) {
      router.push(`/?join=${gameId}`);
    }
  }, [router, user, gameId]);

  // Fetch initial game data
  useEffect(() => {
    if (!user) return;
    getGame(gameId)
      .then((g) => {
        setGame(g);
        setPlayers(g.users);
        setHostId(g.hostId);
      })
      .catch(() => {
        router.push("/");
      });
  }, [gameId, user, router]);

  // Socket: join room + listen to lobby:update
  useEffect(() => {
    if (!user) return;

    socket.emit("player:join", {
      gameId,
      userId: user.userId,
    });

    function onLobbyUpdate(payload: LobbyUpdate) {
      setPlayers(payload.players);
      setHostId(payload.hostId);
    }

    socket.on("lobby:update", onLobbyUpdate);

    return () => {
      socket.emit("player:leave", {
        gameId,
        userId: user.userId,
      });
      socket.off("lobby:update", onLobbyUpdate);
    };
  }, [gameId, user]);

  function copyJoinLink() {
    const link = `${window.location.origin}/?join=${gameId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isHost = user?.userId === hostId;
  const canStart = isHost && players.length >= 2;

  return (
    <div className="relative min-h-screen bg-[#080e20] text-white">
      {/* Fixed gradient backgrounds */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 20%, #7c3aed 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, #6d28d9 0%, transparent 60%)",
        }}
      />

      <Navbar brand="FantasIA Adventure" />

      <div className="relative z-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {game?.name ?? "Chargement..."}
              </h1>
              <p className="font-mono text-xs text-white/50">{gameId}</p>
              {game && (
                <p className="mt-1 text-sm text-white/60">
                  {game.theme} · {game.totalSteps} étapes
                </p>
              )}
            </div>
            <button
              onClick={copyJoinLink}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-green-400" />
                  <span className="text-green-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Copier le lien
                </>
              )}
            </button>
          </div>

          {/* Waiting banner */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-sm text-white/60">En attente des joueurs...</p>
            <p className="mt-1 text-xs text-white/40">
              {players.length} / 6 joueur{players.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Player list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Joueurs
            </h2>
            <div className="grid gap-2">
              {players.map((player) => {
                const avatar = AVATARS[player.avatar as AvatarId];
                const isPlayerHost = player.id === hostId;
                const isMe = player.id === user?.userId;
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    {avatar && <BadgeClasse variant={avatar.classe} />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {player.username}
                        </span>
                        {isMe && (
                          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-xs text-purple-300">
                            Toi
                          </span>
                        )}
                        {isPlayerHost && (
                          <Crown className="size-3.5 text-amber-400" />
                        )}
                      </div>
                      {avatar && (
                        <p className="text-xs text-white/50">
                          {avatar.archetype}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          {isHost ? (
            <div className="space-y-2">
              <Button variant="purple" className="w-full" disabled={!canStart}>
                {canStart
                  ? "Lancer la partie"
                  : "En attente d'un autre joueur..."}
              </Button>
              {!canStart && (
                <p className="text-center text-xs text-white/40">
                  Il faut au moins un autre joueur pour démarrer.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-sm text-white/60">
                En attente que l&apos;hôte lance la partie...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
