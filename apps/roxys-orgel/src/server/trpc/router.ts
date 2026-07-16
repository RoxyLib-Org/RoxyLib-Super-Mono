import { router } from "./trpc";
import { songRouter } from "./routers/song";
import { albumRouter } from "./routers/album";
import { artistRouter } from "./routers/artist";

export const appRouter = router({
  song: songRouter,
  album: albumRouter,
  artist: artistRouter,
});

export type AppRouter = typeof appRouter;
