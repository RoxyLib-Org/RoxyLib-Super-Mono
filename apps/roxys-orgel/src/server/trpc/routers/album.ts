import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { scanR2 } from "@/server/utils/r2-scanner";

export const albumRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const { albums } = await scanR2(ctx.env.R2, ctx.env.KV);
    return albums.map((a) => ({
      id: a.id,
      title: a.title,
      artistName: a.artistName,
      coverKey: a.coverKey,
      songCount: a.songs.length,
    }));
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { albums } = await scanR2(ctx.env.R2, ctx.env.KV);
      const album = albums.find((a) => a.id === input.id);
      if (!album) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Album not found" });
      }
      return {
        id: album.id,
        title: album.title,
        artistName: album.artistName,
        coverKey: album.coverKey,
        songs: album.songs.map((s) => ({
          id: s.id,
          title: s.title,
          trackNumber: s.trackNumber,
          r2Key: s.r2Key,
        })),
      };
    }),
});
