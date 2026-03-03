"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { socket } from "@/00_infra/socket/page";
import { CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navbar } from "@/components/navbar";

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
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold text-white">Partie</h1>
            <p className="font-mono text-xs text-white/50">{gameId}</p>
          </div>

          {/* Feed */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <ScrollArea className="h-96">
                <div className="flex flex-col gap-2">
                  {feed.length === 0 && (
                    <p className="mt-auto text-center text-sm text-white/40">
                      Aucun événement pour l&apos;instant.
                    </p>
                  )}
                  {feed.map((item) => {
                    if (item.type === "joined") {
                      return (
                        <p
                          key={item.id}
                          className="text-xs italic text-green-400"
                        >
                          {item.username} a rejoint la partie
                        </p>
                      );
                    }
                    if (item.type === "left") {
                      return (
                        <p
                          key={item.id}
                          className="text-xs italic text-red-400"
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
                        <span className="text-xs text-white/40">
                          {item.username}
                        </span>
                        <span
                          className={`rounded-lg px-3 py-1.5 text-sm text-white ${
                            isMe
                              ? "bg-purple-500/20"
                              : "bg-white/10"
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
          </div>

          {/* Input */}
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
              variant="purple"
              onClick={sendMessage}
              disabled={!text.trim()}
            >
              Envoyer
            </InputGroupButton>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
