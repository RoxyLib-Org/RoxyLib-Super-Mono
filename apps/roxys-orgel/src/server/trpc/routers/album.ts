import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import db, { albums, artists, songs, eq } from "@lib/db";

export const albumRouter = router({
  list: publicProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const database = db(ctx.env.DB);
      return database
        .select({
          id: albums.id,
          title: albums.title,
          releaseYear: albums.releaseYear,
          artistId: albums.artistId,
          artistName: artists.name,
        })
        .from(albums)
        .innerJoin(artists, eq(albums.artistId, artists.id))
        .orderBy(albums.releaseYear);
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const database = db(ctx.env.DB);
      const [album] = await database
        .select({
          id: albums.id,
          title: albums.title,
          releaseYear: albums.releaseYear,
          artistId: albums.artistId,
          artistName: artists.name,
          artistDescription: artists.description,
        })
        .from(albums)
        .innerJoin(artists, eq(albums.artistId, artists.id))
        .where(eq(albums.id, input.id));

      if (!album) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Album not found" });
      }

      const albumSongs = await database
        .select({
          id: songs.id,
          title: songs.title,
          trackNumber: songs.trackNumber,
          duration: songs.duration,
        })
        .from(songs)
        .where(eq(songs.albumId, input.id))
        .orderBy(songs.trackNumber);

      return { ...album, songs: albumSongs };
    }),
});
