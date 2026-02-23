import type { User } from "./user.ts";

export interface Game {
  id: string;
  users: User[];
}
