import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { decodeId, scanR2 } from "@/server/utils/r2-scanner";

export const songRouter = router({
  list: publicProcedure
    .input(
      z.object({
        albumId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { albums } = await scanR2(ctx.env.R2, ctx.env.KV);

      // Filter by album if specified
      const targetAlbums = input.albumId
        ? albums.filter((a) => a.id === input.albumId)
        : albums;

      const allSongs = targetAlbums.flatMap((album) =>
        album.songs.map((s) => ({
          id: s.id,
          title: s.title,
          trackNumber: s.trackNumber,
          r2Key: s.r2Key,
          albumId: album.id,
          albumTitle: album.title,
          artistName: album.artistName,
        })),
      );

      return allSongs.sort((a, b) => a.trackNumber - b.trackNumber);
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { albums } = await scanR2(ctx.env.R2, ctx.env.KV);

      for (const album of albums) {
        const song = album.songs.find((s) => s.id === input.id);
        if (song) {
          return {
            id: song.id,
            title: song.title,
            trackNumber: song.trackNumber,
            r2Key: song.r2Key,
            albumId: album.id,
            albumTitle: album.title,
            artistName: album.artistName,
          };
        }
      }

      throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
    }),
});
