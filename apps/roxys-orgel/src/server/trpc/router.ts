import { albumRouter } from "./routers/album";
import { artistRouter } from "./routers/artist";
import { songRouter } from "./routers/song";
import { router } from "./trpc";

export const appRouter = router({
  song: songRouter,
  album: albumRouter,
  artist: artistRouter,
});

export type AppRouter = typeof appRouter;
