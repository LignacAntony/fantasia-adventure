import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import { gameRouter } from "./game/game.router.js";
import { envVariables } from "./00_infra/envVariables.js";

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: envVariables.FRONTEND_URL,
  credentials: true,
}));

const io = new Server(httpServer, {
  cors: {
    origin: envVariables.FRONTEND_URL,
    credentials: true
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
