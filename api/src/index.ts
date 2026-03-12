import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { gameRouter } from "./game/game.router.js";
import { adminRouter } from "./admin/admin.router.js";
import { envVariables } from "./00_infra/env/envVariables.js";
import { registerGameSocketHandlers } from "./game/game.socket.js";

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: envVariables.CORS_ORIGINS,
    credentials: true,
  }),
);

const io = new Server(httpServer, {
  cors: {
    origin: envVariables.CORS_ORIGINS,
    credentials: true,
  },
});

registerGameSocketHandlers(io);

app.use(express.json());
app.get("/health", (_req, res) => res.status(200).send("ok"));
app.use("/games", gameRouter);
app.use("/admin", adminRouter);

const PORT = process.env.PORT ?? 3001;
const HOST = "0.0.0.0";
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`server listening on ${HOST}:${PORT}`);
});
