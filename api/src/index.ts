import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { envVariables } from "./00_infra/env_variables/env_variables.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: envVariables.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(3001, () => {
  console.log(`server listening on ${envVariables.FRONTEND_URL}`);
});
