"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, Crown, Loader2, Trophy, Users, User } from "lucide-react";
import { socket } from "@/00_infra/socket/page";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { BadgeClasse } from "@/components/badge-classe";
import { getGame } from "@/lib/api";
import type { Game, Player } from "@/lib/api";
import type { AvatarId } from "@/lib/avatars";
import { AVATARS } from "@/lib/avatars";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type LobbyUpdate = {
  players: Player[];
  hostId: string | null;
};

type GameStarting = {
  currentStep: number;
  totalSteps: number;
};

type GameStarted =
  | {
      stepType: "collective";
      narration: string;
      choices: string[];
      currentStep: number;
      totalSteps: number;
      timerMs: number;
    }
  | {
      stepType: "individual";
      narration: string;
      suggestions: Record<string, string[]>;
      currentStep: number;
      totalSteps: number;
      timerMs: number;
    };

type StepChoicesUpdate = {
  submitted: number;
  total: number;
};

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Game state
  const [gameStatus, setGameStatus] = useState<
    "lobby" | "starting" | "en_cours" | "synthèse" | "terminée"
  >("lobby");
  const [narration, setNarration] = useState<string | null>(null);
  const [stepType, setStepType] = useState<"collective" | "individual">(
    "individual",
  );
  const [collectiveChoices, setCollectiveChoices] = useState<string[]>([]);
  const [mySuggestions, setMySuggestions] = useState<string[]>([]);
  const [hasChosen, setHasChosen] = useState(false);
  const [choicesProgress, setChoicesProgress] =
    useState<StepChoicesUpdate | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const [user] = useState<{ userId: string; username: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("fantasia_user");
    return raw ? JSON.parse(raw) : null;
  });

  /** True once the first step narration has been received (game is truly in progress) */
  const hasStartedRef = useRef(false);

  const [stepTimeLeft, setStepTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Total seconds of the step timer (for the timer progress bar ratio) */
  const [totalTimerSeconds, setTotalTimerSeconds] = useState<number>(60);

  const [showChoices, setShowChoices] = useState(false);
  const showChoicesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Redirect if no user
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
        setTotalSteps(g.totalSteps);
        if (g.status === "en_cours") {
          setGameStatus("en_cours");
          setShowChoices(true); // no reading delay on reconnect
          setCurrentStep(g.currentStep);
          if (g.currentNarration) {
            setNarration(g.currentNarration.narration);
            setStepType(g.currentNarration.stepType);
            if (g.currentNarration.stepType === "collective") {
              setCollectiveChoices(g.currentNarration.choices);
            } else {
              setMySuggestions(
                g.currentNarration.suggestions[user.userId] ?? [],
              );
            }
          }
        }
        if (g.status === "terminée") {
          setGameStatus("terminée");
          setCurrentStep(g.currentStep);
          if (g.currentNarration) {
            setNarration(g.currentNarration.narration);
            setStepType(g.currentNarration.stepType);
          }
        }
      })
      .catch(() => router.push("/"));
  }, [gameId, user, router]);

  // Socket: join room + events
  useEffect(() => {
    if (!user) return;
    const userId = user.userId;

    socket.emit("player:join", { gameId, userId });

    function onLobbyUpdate(payload: LobbyUpdate) {
      setPlayers(payload.players);
      setHostId(payload.hostId);
    }

    function startStepCountdown(ms: number) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const seconds = Math.ceil(ms / 1000);
      setTotalTimerSeconds(seconds);
      setStepTimeLeft(seconds);
      let remaining = seconds;
      timerIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setStepTimeLeft(0);
          setGameStatus((prev) => (prev === "en_cours" ? "synthèse" : prev));
        } else {
          setStepTimeLeft(remaining);
        }
      }, 1000);
    }

    function onGameStarting(payload: GameStarting) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setStepTimeLeft(null);
      //         initial start → blank loading screen
      if (hasStartedRef.current) {
        setGameStatus("synthèse");
      } else {
        setGameStatus("starting");
      }
      setCurrentStep(payload.currentStep);
      setTotalSteps(payload.totalSteps);
    }

    function onGameStarted(payload: GameStarted) {
      hasStartedRef.current = true;
      startStepCountdown(payload.timerMs);
      setNarration(payload.narration);
      setStepType(payload.stepType);
      setCurrentStep(payload.currentStep);
      setTotalSteps(payload.totalSteps);
      setHasChosen(false);
      setChoicesProgress(null);

      if (payload.stepType === "collective") {
        setCollectiveChoices(payload.choices ?? []);
        setMySuggestions([]);
      } else {
        setMySuggestions(payload.suggestions?.[userId] ?? []);
        setCollectiveChoices([]);
      }

      setGameStatus("en_cours");

      if (showChoicesTimeoutRef.current)
        clearTimeout(showChoicesTimeoutRef.current);
      setShowChoices(false);
      showChoicesTimeoutRef.current = setTimeout(
        () => setShowChoices(true),
        2500,
      );
    }

    function onGameError() {
      setGameStatus((prev) => {
        if (prev === "starting") {
          if (hasStartedRef.current) {
            // Mid-game step failed: stay in en_cours so players can retry.
            // Narration/choices are still the last good values.
            setHasChosen(false);
            setChoicesProgress(null);
            setCurrentStep((s) => s - 1); // undo the optimistic step increment
            return "en_cours";
          }
          // Initial game start failed: go back to lobby
          return "lobby";
        }
        if (prev === "en_cours" || prev === "synthèse") {
          // AI failed during synthesis: reset so players can re-submit.
          setHasChosen(false);
          setChoicesProgress(null);
          setShowChoices(true); // re-show choices immediately (no reading delay)
          return "en_cours";
        }
        return prev;
      });
    }

    function onStepChoicesUpdate(payload: StepChoicesUpdate) {
      setChoicesProgress(payload);
      if (payload.submitted >= payload.total) {
        setGameStatus((prev) => (prev === "en_cours" ? "synthèse" : prev));
      }
    }

    function onGameEnded() {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setStepTimeLeft(null);
      setGameStatus("terminée");
    }

    socket.on("lobby:update", onLobbyUpdate);
    socket.on("game:starting", onGameStarting);
    socket.on("game:started", onGameStarted);
    socket.on("game:error", onGameError);
    socket.on("step:choices:update", onStepChoicesUpdate);
    socket.on("game:ended", onGameEnded);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (showChoicesTimeoutRef.current) {
        clearTimeout(showChoicesTimeoutRef.current);
        showChoicesTimeoutRef.current = null;
      }
      socket.emit("player:leave", { gameId, userId });
      socket.off("lobby:update", onLobbyUpdate);
      socket.off("game:starting", onGameStarting);
      socket.off("game:started", onGameStarted);
      socket.off("game:error", onGameError);
      socket.off("step:choices:update", onStepChoicesUpdate);
      socket.off("game:ended", onGameEnded);
    };
  }, [gameId, user]);

  function copyJoinLink() {
    const link = `${window.location.origin}/?join=${gameId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleStartGame() {
    if (!user) return;
    socket.emit("game:start", { gameId, userId: user.userId });
  }

  function handleChoice(choice: string) {
    if (!user || hasChosen) return;
    setHasChosen(true);
    socket.emit("player:choice", { gameId, userId: user.userId, choice });
  }

  const isHost = user?.userId === hostId;
  const canStart = isHost && players.length >= 2;

  return (
    <div className="relative min-h-screen bg-[#080e20] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 20%, #7c3aed 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, #6d28d9 0%, transparent 60%)",
        }}
      />

      <Navbar brand="FantasIA Adventure" />

      <div className="relative z-10">
        {gameStatus === "lobby" && (
          <LobbyScreen
            game={game}
            gameId={gameId}
            players={players}
            hostId={hostId}
            userId={user?.userId ?? null}
            isHost={isHost}
            canStart={canStart}
            copied={copied}
            onCopyLink={copyJoinLink}
            onStartGame={handleStartGame}
          />
        )}

        {gameStatus === "starting" && (
          <StartingScreen currentStep={currentStep} totalSteps={totalSteps} />
        )}

        {(gameStatus === "en_cours" || gameStatus === "synthèse") &&
          narration && (
            <GameScreen
              game={game}
              currentStep={currentStep}
              totalSteps={totalSteps}
              narration={narration}
              stepType={stepType}
              collectiveChoices={collectiveChoices}
              mySuggestions={mySuggestions}
              hasChosen={hasChosen}
              choicesProgress={choicesProgress}
              stepTimeLeft={stepTimeLeft}
              showChoices={showChoices}
              isSynthèse={gameStatus === "synthèse"}
              totalTimerSeconds={totalTimerSeconds}
              onChoice={handleChoice}
            />
          )}

        {gameStatus === "terminée" && (
          <EndScreen
            totalSteps={totalSteps}
            narration={narration}
            onHome={() => router.push("/")}
          />
        )}
      </div>
    </div>
  );
}

function EndScreen({
  totalSteps,
  narration,
  onHome,
}: {
  totalSteps: number;
  narration: string | null;
  onHome: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-16 text-center">
      {/* Trophy icon */}
      <div className="flex size-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
        <Trophy className="size-10 text-amber-400" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">
          L&apos;aventure est terminée&nbsp;!
        </h1>
        <p className="text-sm text-white/50">
          {totalSteps} étape{totalSteps > 1 ? "s" : ""} accomplies
        </p>
      </div>

      {/* Last narration as epilogue */}
      {narration && (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-400">
            Épilogue
          </p>
          <p className="mt-3 leading-relaxed text-white/80">{narration}</p>
        </div>
      )}

      {/* Home button */}
      <Button variant="purple" className="w-full max-w-xs" onClick={onHome}>
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}

function LobbyScreen({
  game,
  gameId,
  players,
  hostId,
  userId,
  isHost,
  canStart,
  copied,
  onCopyLink,
  onStartGame,
}: {
  game: Game | null;
  gameId: string;
  players: Player[];
  hostId: string | null;
  userId: string | null;
  isHost: boolean;
  canStart: boolean;
  copied: boolean;
  onCopyLink: () => void;
  onStartGame: () => void;
}) {
  return (
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
          onClick={onCopyLink}
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
            const isMe = player.id === userId;
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
                    <p className="text-xs text-white/50">{avatar.archetype}</p>
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
          <Button
            variant="purple"
            className="w-full"
            disabled={!canStart}
            onClick={onStartGame}
          >
            {canStart ? "Lancer la partie" : "En attente d'un autre joueur..."}
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
  );
}

function StartingScreen({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <Loader2 className="size-12 animate-spin text-purple-400" />
      <div className="text-center">
        <p className="text-lg font-semibold text-white">
          Le Maître du Jeu prépare l&apos;aventure…
        </p>
        <p className="mt-1 text-sm text-white/50">
          Étape {currentStep} / {totalSteps}
        </p>
      </div>
    </div>
  );
}

function GameScreen({
  game,
  currentStep,
  totalSteps,
  narration,
  stepType,
  collectiveChoices,
  mySuggestions,
  hasChosen,
  choicesProgress,
  stepTimeLeft,
  showChoices,
  isSynthèse,
  totalTimerSeconds,
  onChoice,
}: {
  game: Game | null;
  currentStep: number;
  totalSteps: number;
  narration: string;
  stepType: "collective" | "individual";
  collectiveChoices: string[];
  mySuggestions: string[];
  hasChosen: boolean;
  choicesProgress: StepChoicesUpdate | null;
  stepTimeLeft: number | null;
  showChoices: boolean;
  isSynthèse: boolean;
  totalTimerSeconds: number;
  onChoice: (choice: string) => void;
}) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  const isCollective = stepType === "collective";
  const isLastStep = currentStep === totalSteps;

  const timerColor =
    stepTimeLeft !== null && stepTimeLeft <= 5
      ? "text-red-400"
      : stepTimeLeft !== null && stepTimeLeft <= 15
        ? "text-amber-400"
        : "text-white/40";

  const timerProgress =
    stepTimeLeft !== null && totalTimerSeconds > 0
      ? (stepTimeLeft / totalTimerSeconds) * 100
      : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-white">{game?.name}</span>
          <div className="flex items-center gap-3">
            {stepTimeLeft !== null && stepTimeLeft > 0 && (
              <span className={`font-mono text-xs tabular-nums ${timerColor}`}>
                ⏱ {stepTimeLeft}s
              </span>
            )}
            <span className="text-white/50">
              Étape {currentStep} / {totalSteps}
            </span>
            {isLastStep && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                Épilogue
              </span>
            )}
          </div>
        </div>
        <Progress
          value={progress}
          className={cn(
            "h-1.5",
            isLastStep &&
              "animate-pulse [&>[data-slot=progress-indicator]]:bg-amber-400",
          )}
        />
        {stepTimeLeft !== null && stepTimeLeft > 0 && (
          <Progress value={timerProgress} className="h-0.5 opacity-40" />
        )}
      </div>

      {/* Step type badge */}
      <div className="flex items-center gap-2">
        {isCollective ? (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <Users className="size-3" />
            Décision collective
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            <User className="size-3" />
            Action individuelle
          </span>
        )}
      </div>

      {/* Narration */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-400">
          Narration
        </p>
        <p className="mt-3 leading-relaxed text-white/90">{narration}</p>
      </div>

      {isSynthèse && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 text-center">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="size-4 animate-spin text-purple-400" />
            <span className="text-sm font-medium text-white/80">
              L&apos;IA rédige la suite…
            </span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "transition-all duration-500",
          showChoices && !isSynthèse
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        {!hasChosen ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/50">
              {isCollective ? "Vote du groupe" : "Tes actions"}
            </p>
            <div className="grid gap-2">
              {(isCollective
                ? (collectiveChoices ?? [])
                : (mySuggestions ?? [])
              ).map((option, i) => (
                <button
                  key={i}
                  onClick={() => onChoice(option)}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/80 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                >
                  <span className="mr-2 font-bold text-purple-400">
                    {i + 1}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Waiting for other players */
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Loader2 className="size-4 animate-spin text-purple-400" />
              <span className="text-sm">
                {isCollective ? "Vote enregistré" : "Choix enregistré"} — En
                attente des autres…
              </span>
            </div>
            {choicesProgress && (
              <p className="mt-2 text-xs text-white/40">
                {choicesProgress.submitted} / {choicesProgress.total} joueur
                {choicesProgress.total > 1 ? "s" : ""} ont répondu
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
