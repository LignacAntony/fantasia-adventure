"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Bot, Shuffle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FeatureCard } from "@/components/feature-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createGame, joinGame, getGame } from "@/lib/api";
import { AlertCircleIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVATARS, AVATAR_IDS } from "@/lib/avatars";
import type { AvatarId } from "@/lib/avatars";
import { BadgeClasse } from "@/components/badge-classe";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Accueil", href: "/" },
  { label: "Créer", href: "#" },
  { label: "Rejoindre", href: "#" },
];

const PREDEFINED_THEMES = [
  "La forêt maudite",
  "Les ruines oubliées",
  "L'île des tempêtes",
  "Le donjon de cristal",
  "La cité engloutie",
  "Thème personnalisé...",
];

type ModalType = "create" | "join" | null;

// ─── Avatar selection grid ────────────────────────────────────────────────────

function AvatarGrid({
  takenAvatars,
  selectedAvatar,
  onSelect,
  disabled,
}: {
  takenAvatars: AvatarId[];
  selectedAvatar: AvatarId | null;
  onSelect: (id: AvatarId) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">
        Choisis ton personnage pour cette aventure.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {AVATAR_IDS.map((id) => {
          const avatar = AVATARS[id];
          const taken = takenAvatars.includes(id);
          const selected = selectedAvatar === id;
          return (
            <button
              key={id}
              type="button"
              disabled={taken || disabled}
              onClick={() => onSelect(id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition",
                taken
                  ? "cursor-not-allowed border-white/5 opacity-40"
                  : selected
                    ? "border-purple-500 bg-purple-500/20 ring-1 ring-purple-500/50"
                    : "cursor-pointer border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
              )}
            >
              <BadgeClasse variant={avatar.classe} />
              <div>
                <p className="text-sm font-semibold text-white">
                  {avatar.name}
                </p>
                <p className="text-xs text-white/50">{avatar.archetype}</p>
              </div>
              {taken && <span className="text-xs text-white/40">Pris</span>}
            </button>
          );
        })}
      </div>
      {selectedAvatar && (
        <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold text-emerald-400">
            ✦ {AVATARS[selectedAvatar].advantage}
          </p>
          <p className="text-xs font-semibold text-red-400">
            ✦ {AVATARS[selectedAvatar].disadvantage}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Home content ─────────────────────────────────────────────────────────────

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinId = searchParams.get("join");

  const [modal, setModal] = useState<ModalType>(joinId ? "join" : null);
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [gameId, setGameId] = useState(joinId ?? "");
  const [sessionName, setSessionName] = useState("");
  const [themeSelect, setThemeSelect] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [totalSteps, setTotalSteps] = useState(5);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId | null>(null);
  const [takenAvatars, setTakenAvatars] = useState<AvatarId[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomTheme = themeSelect === "Thème personnalisé...";
  const resolvedTheme = isCustomTheme ? customTheme : themeSelect;

  function openModal(type: ModalType) {
    setError(null);
    setUsername("");
    setGameId("");
    setSessionName("");
    setThemeSelect("");
    setCustomTheme("");
    setTotalSteps(7);
    setStep(1);
    setSelectedAvatar(null);
    setTakenAvatars([]);
    setModal(type);
  }

  function closeModal() {
    if (loading) return;
    setModal(null);
    setError(null);
    setStep(1);
    setSelectedAvatar(null);
  }

  function saveUser(userId: string, username: string) {
    localStorage.setItem("fantasia_user", JSON.stringify({ userId, username }));
  }

  // ── CREATE — step 1: validate → step 2 ──────────────────────────────────────

  function handleCreateNext() {
    if (!username.trim()) {
      setError("Entre un nom d'utilisateur");
      return;
    }
    if (!sessionName.trim()) {
      setError("Donne un nom à ta session");
      return;
    }
    if (!resolvedTheme.trim()) {
      setError("Choisis ou saisis un thème");
      return;
    }
    setError(null);
    setStep(2);
  }

  // ── CREATE — step 2: pick avatar → create + join ─────────────────────────────

  async function handleCreateGame() {
    if (!selectedAvatar) {
      setError("Choisis un avatar");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const game = await createGame({
        name: sessionName.trim(),
        theme: resolvedTheme.trim(),
        totalSteps,
      });
      const joined = await joinGame(game.id, username.trim(), selectedAvatar);
      const me = joined.users.find((u) => u.username === username.trim());
      if (me) saveUser(me.id, me.username);
      router.push(`/game/${game.id}`);
    } catch {
      setError("Une erreur est survenue, réessaie.");
      setLoading(false);
    }
  }

  // ── JOIN — step 1: validate + fetch taken avatars → step 2 ──────────────────

  async function handleJoinNext() {
    if (!username.trim()) {
      setError("Entre un nom d'utilisateur");
      return;
    }
    if (!gameId.trim()) {
      setError("Entre un ID de partie");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const game = await getGame(gameId.trim());
      const taken = game.users.map((u) => u.avatar as AvatarId);
      setTakenAvatars(taken);
      setStep(2);
    } catch {
      setError("Partie introuvable ou erreur serveur.");
    } finally {
      setLoading(false);
    }
  }

  // ── JOIN — step 2: pick avatar → join ────────────────────────────────────────

  async function handleJoinGame() {
    if (!selectedAvatar) {
      setError("Choisis un avatar");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const joined = await joinGame(
        gameId.trim(),
        username.trim(),
        selectedAvatar,
      );
      const me = joined.users.find((u) => u.username === username.trim());
      if (me) saveUser(me.id, me.username);
      router.push(`/game/${gameId.trim()}`);
    } catch {
      setError("Partie introuvable ou erreur serveur.");
      setLoading(false);
    }
  }

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

      <Navbar brand="FantasIA Adventure" items={NAV_ITEMS} />

      <main className="relative z-10">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              FantasIA Adventure
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">
            Plonge dans une aventure de jeu de rôle multijoueur guidée par une
            intelligence artificielle. Crée ta partie ou rejoins celle d&apos;un
            ami.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="purple"
              size="lg"
              onClick={() => openModal("create")}
            >
              Créer une partie
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => openModal("join")}
            >
              Rejoindre une partie
            </Button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-4xl px-4 pb-24">
          <Separator className="mb-16 opacity-10" />
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              variant="dark"
              icon={<Users />}
              title="1–6 Joueurs"
              description="Rejoins tes amis pour une aventure commune en temps réel."
            />
            <FeatureCard
              variant="dark"
              icon={<Bot />}
              title="IA Maître du Jeu"
              description="Une IA narrative dirige l'histoire et réagit à vos choix."
            />
            <FeatureCard
              variant="dark"
              icon={<Shuffle />}
              title="Rejouabilité infinie"
              description="Chaque partie génère une histoire unique et imprévisible."
            />
          </div>
        </section>
      </main>

      <Footer
        brand="FantasIA Adventure"
        copyright={`© ${new Date().getFullYear()} FantasIA Adventure`}
      />

      {/* ── Create dialog ──────────────────────────────────────────────────────── */}
      <Dialog
        open={modal === "create"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent
          className={cn(
            "border-white/10 bg-[#080e20] text-white",
            step === 2 ? "sm:max-w-lg" : "sm:max-w-sm",
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {step === 1 ? "Créer une partie" : "Choisir ton avatar"}
            </DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-session-name" className="text-white/80">
                  Nom de la session
                </Label>
                <Input
                  id="create-session-name"
                  placeholder="ex. La quête des anciens"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-purple-500 focus-visible:ring-purple-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/80">Thème</Label>
                <Select
                  value={themeSelect}
                  onValueChange={setThemeSelect}
                  disabled={loading}
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white focus:ring-purple-500/20">
                    <SelectValue placeholder="Choisir un thème..." />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0d1526] text-white">
                    {PREDEFINED_THEMES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className="focus:bg-white/10"
                      >
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isCustomTheme && (
                  <Input
                    placeholder="Décris ta quête personnalisée..."
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    disabled={loading}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-purple-500 focus-visible:ring-purple-500/20"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-steps" className="text-white/80">
                  Nombre d&apos;étapes&nbsp;
                  <span className="font-semibold text-purple-400">
                    {totalSteps}
                  </span>
                </Label>
                <input
                  id="create-steps"
                  type="range"
                  min={1}
                  max={5}
                  value={totalSteps}
                  onChange={(e) => setTotalSteps(Number(e.target.value))}
                  disabled={loading}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-username" className="text-white/80">
                  Ton pseudo
                </Label>
                <Input
                  id="create-username"
                  placeholder="ex. Aragorn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNext()}
                  disabled={loading}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-purple-500 focus-visible:ring-purple-500/20"
                />
              </div>
            </div>
          ) : (
            <AvatarGrid
              takenAvatars={takenAvatars}
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
              disabled={loading}
            />
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            {step === 2 ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  disabled={loading}
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                >
                  Retour
                </Button>
                <Button
                  variant="purple"
                  onClick={handleCreateGame}
                  disabled={loading || !selectedAvatar}
                >
                  {loading ? "Création..." : "Créer"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={closeModal}
                  disabled={loading}
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  variant="purple"
                  onClick={handleCreateNext}
                  disabled={loading}
                >
                  Suivant
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Join dialog ────────────────────────────────────────────────────────── */}
      <Dialog
        open={modal === "join"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent
          className={cn(
            "border-white/10 bg-[#080e20] text-white",
            step === 2 ? "sm:max-w-lg" : "sm:max-w-sm",
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {step === 1 ? "Rejoindre une partie" : "Choisir ton avatar"}
            </DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="join-username" className="text-white/80">
                  Pseudo
                </Label>
                <Input
                  id="join-username"
                  placeholder="ex. Aragorn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-purple-500 focus-visible:ring-purple-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="join-game-id" className="text-white/80">
                  ID de la partie
                </Label>
                <Input
                  id="join-game-id"
                  placeholder="ex. abc123xyz"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinNext()}
                  readOnly={!!searchParams.get("join")}
                  disabled={loading}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-purple-500 focus-visible:ring-purple-500/20"
                />
              </div>
            </div>
          ) : (
            <AvatarGrid
              takenAvatars={takenAvatars}
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
              disabled={loading}
            />
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            {step === 2 ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  disabled={loading}
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                >
                  Retour
                </Button>
                <Button
                  variant="outline"
                  onClick={handleJoinGame}
                  disabled={loading || !selectedAvatar}
                >
                  {loading ? "Connexion..." : "Rejoindre"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={closeModal}
                  disabled={loading}
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  variant="outline"
                  onClick={handleJoinNext}
                  disabled={loading}
                >
                  {loading ? "Chargement..." : "Suivant"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
