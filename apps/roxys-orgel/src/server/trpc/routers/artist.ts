import db, { albums, artists, eq, songs } from "@lib/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const artistRouter = router({
  list: publicProcedure.input(z.object({})).query(async ({ ctx }) => {
    const database = db(ctx.env.DB);
    return database
      .select({
        id: artists.id,
        name: artists.name,
        description: artists.description,
      })
      .from(artists);
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const database = db(ctx.env.DB);
      const [artist] = await database
        .select({
          id: artists.id,
          name: artists.name,
          description: artists.description,
        })
        .from(artists)
        .where(eq(artists.id, input.id));

      if (!artist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artist not found",
        });
      }

      const artistAlbums = await database
        .select({
          id: albums.id,
          title: albums.title,
          releaseYear: albums.releaseYear,
        })
        .from(albums)
        .where(eq(albums.artistId, input.id))
        .orderBy(albums.releaseYear);

      const artistSongs = await database
        .select({
          id: songs.id,
          title: songs.title,
          trackNumber: songs.trackNumber,
          duration: songs.duration,
          albumId: songs.albumId,
          albumTitle: albums.title,
        })
        .from(songs)
        .innerJoin(albums, eq(songs.albumId, albums.id))
        .where(eq(songs.artistId, input.id))
        .orderBy(songs.trackNumber);

      return { ...artist, albums: artistAlbums, songs: artistSongs };
    }),
});
