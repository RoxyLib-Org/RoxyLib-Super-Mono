import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { scanR2 } from "@/server/utils/r2-scanner";

export const artistRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const { artists } = await scanR2(ctx.env.R2, ctx.env.KV);
    return artists;
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { artists, albums } = await scanR2(ctx.env.R2, ctx.env.KV);

      const artist = artists.find((a) => a.id === input.id);
      if (!artist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artist not found",
        });
      }

      const artistAlbums = albums
        .filter((a) => a.artistName === artist.name)
        .map((a) => ({
          id: a.id,
          title: a.title,
          coverKey: a.coverKey,
          songCount: a.songs.length,
        }));

      const artistSongs = albums
        .filter((a) => a.artistName === artist.name)
        .flatMap((a) =>
          a.songs.map((s) => ({
            id: s.id,
            title: s.title,
            trackNumber: s.trackNumber,
            r2Key: s.r2Key,
            albumId: a.id,
            albumTitle: a.title,
          })),
        )
        .sort((a, b) => a.trackNumber - b.trackNumber);

      return {
        id: artist.id,
        name: artist.name,
        albums: artistAlbums,
        songs: artistSongs,
      };
    }),
});
