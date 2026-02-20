import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { gameRouter } from "./game/game.router.js";
import { envVariables } from "./00_infra/env/envVariables.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: envVariables.FRONTEND_URL,
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.use(express.json());
app.use("/games", gameRouter);

httpServer.listen(3001, () => {
  console.log(`server listening on port 3001`);
});
