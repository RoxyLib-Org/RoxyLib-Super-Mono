import db, { albums, and, artists, asc, eq, lyrics, songs } from "@lib/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const songRouter = router({
  list: publicProcedure
    .input(
      z.object({
        artistId: z.string().optional(),
        albumId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const database = db(ctx.env.DB);
      const conditions = [];
      if (input.artistId) conditions.push(eq(songs.artistId, input.artistId));
      if (input.albumId) conditions.push(eq(songs.albumId, input.albumId));

      return database
        .select({
          id: songs.id,
          title: songs.title,
          trackNumber: songs.trackNumber,
          duration: songs.duration,
          artistId: songs.artistId,
          artistName: artists.name,
          albumId: songs.albumId,
          albumTitle: albums.title,
        })
        .from(songs)
        .innerJoin(artists, eq(songs.artistId, artists.id))
        .innerJoin(albums, eq(songs.albumId, albums.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(songs.trackNumber));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const database = db(ctx.env.DB);
      const result = await database
        .select({
          id: songs.id,
          title: songs.title,
          trackNumber: songs.trackNumber,
          duration: songs.duration,
          r2Key: songs.r2Key,
          artistId: songs.artistId,
          artistName: artists.name,
          artistDescription: artists.description,
          albumId: songs.albumId,
          albumTitle: albums.title,
          albumReleaseYear: albums.releaseYear,
          lyricContent: lyrics.content,
        })
        .from(songs)
        .innerJoin(artists, eq(songs.artistId, artists.id))
        .innerJoin(albums, eq(songs.albumId, albums.id))
        .leftJoin(lyrics, eq(songs.id, lyrics.songId))
        .where(eq(songs.id, input.id));

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      }

      return result[0];
    }),
});
