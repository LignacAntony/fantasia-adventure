import { Router } from "express";
import { gameRepository } from "./repository/game.repository.ts";
import { CreateGameUsecase } from "./usecases/createGame/createGame.usecase.ts";
import { ListGamesUsecase } from "./usecases/listGames/listGames.usecase.ts";
import { GetGameByIdUsecase } from "./usecases/getGameById/getGameById.usecase.ts";
import { AddUserToGameUsecase } from "./usecases/addUserToGame/addUserToGame.usecase.ts";

export const gameRouter = Router();

gameRouter.post("/", async (_req, res) => {
  await new CreateGameUsecase(gameRepository, {
    success: (game) => {
      console.log(`[CreateGamePresenter] Sending 201 for game ${game.id}`);
      res.status(201).json(game);
    },
  }).execute();
});

gameRouter.get("/", async (_req, res) => {
  await new ListGamesUsecase(gameRepository, {
    success: (games) => {
      console.log(`[ListGamesPresenter] Sending ${games.length} game(s)`);
      res.json(games);
    },
  }).execute();
});

gameRouter.get("/:id", async (req, res) => {
  await new GetGameByIdUsecase(gameRepository, {
    success: (game) => {
      console.log(`[GetGameByIdPresenter] Sending game ${game.id}`);
      res.json(game);
    },
    notFound: () => {
      console.log("[GetGameByIdPresenter] Game not found, sending 404");
      res.status(404).json({ message: "Partie not found" });
    },
    invalidArgs: () => {
      console.log("[GetGameByIdPresenter] Invalid game id, sending 400");
      res.status(400).json({ message: "Invalid game id" });
    },
  }).execute(req.params);
});

gameRouter.post("/:id/users", async (req, res) => {
  await new AddUserToGameUsecase(gameRepository, {
    success: (game) => {
      console.log(`[AddUserToGamePresenter] Sending updated game ${game.id}`);
      res.json(game);
    },
    notFound: () => {
      console.log("[AddUserToGamePresenter] Game not found, sending 404");
      res.status(404).json({ message: "Partie not found" });
    },
    invalidArgs: () => {
      console.log("[AddUserToGamePresenter] Invalid args, sending 400");
      res.status(400).json({ message: "Invalid request" });
    },
  }).execute(req.params, req.body);
});
