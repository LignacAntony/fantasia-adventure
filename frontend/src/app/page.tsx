"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createGame, joinGame } from "@/lib/api";
import { AlertCircleIcon } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function saveUser(userId: string, username: string) {
    localStorage.setItem("fantasia_user", JSON.stringify({ userId, username }));
  }

  async function handleCreateGame() {
    if (!username.trim()) {
      setError("Entre un nom d'utilisateur");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const game = await createGame();
      const joined = await joinGame(game.id, username.trim());
      const me = joined.users.find((u) => u.username === username.trim());
      if (me) saveUser(me.id, me.username);
      router.push(`/game/${game.id}`);
    } catch {
      setError("Une erreur est survenue, réessaie.");
      setLoading(false);
    }
  }

  async function handleJoinGame() {
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
      const joined = await joinGame(gameId.trim(), username.trim());
      const me = joined.users.find((u) => u.username === username.trim());
      if (me) saveUser(me.id, me.username);
      router.push(`/game/${gameId.trim()}`);
    } catch {
      setError("Partie introuvable ou erreur serveur.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Fantasia Adventure
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crée ou rejoins une partie
          </p>
        </div>

        <Tabs
          defaultValue="create"
          className="w-full"
          onValueChange={() => setError(null)}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base">
                Nom d&apos;utilisateur
              </CardTitle>
              <CardDescription>
                Ce nom sera visible par les autres joueurs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="username">Pseudo</Label>
                <Input
                  id="username"
                  placeholder="ex. Aragorn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </CardContent>

            <Separator />

            <CardContent className="pt-4 space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="create" className="flex-1">
                  Créer
                </TabsTrigger>
                <TabsTrigger value="join" className="flex-1">
                  Rejoindre
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <p className="text-sm text-muted-foreground">
                  Une nouvelle partie sera créée et tu y seras automatiquement
                  ajouté.
                </p>
              </TabsContent>

              <TabsContent value="join" className="space-y-1.5">
                <Label htmlFor="game-id">ID de la partie</Label>
                <Input
                  id="game-id"
                  placeholder="ex. abc123xyz"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                  disabled={loading}
                />
              </TabsContent>
            </CardContent>

            {error && (
              <CardContent className="pt-0">
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </CardContent>
            )}

            <CardFooter>
              <TabsContent value="create" className="w-full mt-0">
                <Button
                  className="w-full"
                  onClick={handleCreateGame}
                  disabled={loading}
                >
                  {loading ? "Création..." : "Créer une partie"}
                </Button>
              </TabsContent>
              <TabsContent value="join" className="w-full mt-0">
                <Button
                  className="w-full"
                  onClick={handleJoinGame}
                  disabled={loading}
                >
                  {loading ? "Connexion..." : "Rejoindre la partie"}
                </Button>
              </TabsContent>
            </CardFooter>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
