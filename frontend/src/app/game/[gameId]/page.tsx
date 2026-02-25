"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { socket } from "@/00_infra/socket/page";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";

type FeedItem =
  | { id: string; type: "joined"; username: string }
  | { id: string; type: "left"; username: string }
  | { id: string; type: "message"; username: string; text: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<{ userId: string; username: string } | null>(
    null,
  );
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("fantasia_user");
    if (!raw) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(raw));
  }, [router]);

  // Socket setup
  useEffect(() => {
    if (!user) return;

    socket.emit("game:join", {
      gameId,
      userId: user.userId,
      username: user.username,
    });

    function onPlayerJoined(payload: { username: string }) {
      setFeed((f) => [
        ...f,
        { id: uid(), type: "joined", username: payload.username },
      ]);
    }
    function onPlayerLeft(payload: { username: string }) {
      setFeed((f) => [
        ...f,
        { id: uid(), type: "left", username: payload.username },
      ]);
    }
    function onMessage(payload: { username: string; text: string }) {
      setFeed((f) => [
        ...f,
        {
          id: uid(),
          type: "message",
          username: payload.username,
          text: payload.text,
        },
      ]);
    }

    socket.on("game:player-joined", onPlayerJoined);
    socket.on("game:player-left", onPlayerLeft);
    socket.on("game:message", onMessage);

    return () => {
      socket.emit("game:leave", {
        gameId,
        userId: user.userId,
        username: user.username,
      });
      socket.off("game:player-joined", onPlayerJoined);
      socket.off("game:player-left", onPlayerLeft);
      socket.off("game:message", onMessage);
    };
  }, [gameId, user]);

  // Scroll to bottom on new feed item
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed]);

  function sendMessage() {
    if (!text.trim() || !user) return;
    socket.emit("game:message", {
      gameId,
      userId: user.userId,
      username: user.username,
      text: text.trim(),
    });
    setText("");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background py-10 px-4">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Partie</h1>
          <p className="text-xs text-muted-foreground font-mono">{gameId}</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-96">
              <div className="flex flex-col gap-2">
                {feed.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-auto">
                    Aucun événement pour l&apos;instant.
                  </p>
                )}
                {feed.map((item) => {
                  if (item.type === "joined") {
                    return (
                      <p
                        key={item.id}
                        className="text-xs text-green-600 dark:text-green-400 italic"
                      >
                        {item.username} a rejoint la partie
                      </p>
                    );
                  }
                  if (item.type === "left") {
                    return (
                      <p
                        key={item.id}
                        className="text-xs text-destructive italic"
                      >
                        {item.username} a quitté la partie
                      </p>
                    );
                  }
                  const isMe = item.username === user?.username;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-xs text-muted-foreground">
                        {item.username}
                      </span>
                      <span
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  );
                })}
                <div ref={feedEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <InputGroup>
          <InputGroupInput
            placeholder="Écrire un message..."
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setText(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && sendMessage()
            }
          />
          <InputGroupButton
            variant="default"
            onClick={sendMessage}
            disabled={!text.trim()}
          >
            Envoyer
          </InputGroupButton>
        </InputGroup>
      </div>
    </div>
  );
}
