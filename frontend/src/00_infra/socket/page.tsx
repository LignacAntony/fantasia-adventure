"use client";

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

export const socket: Socket = io(SOCKET_URL, {
    autoConnect: false,
});

export function joinRoom(gameId: string, userId: string) {
    if (!socket.connected) {
        socket.connect();
    }

    socket.emit("game:join", { gameId, userId });
}

export function leaveRoom(gameId: string, userId: string) {
    socket.emit("game:leave", { gameId, userId });
}

export function sendChoice(
    gameId: string,
    userId: string,
    choice: string
) {
    socket.emit("game:choice", {
        gameId,
        userId,
        choice,
    });
}