import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const artistRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const { results } = await ctx.env.DB.prepare(
      "SELECT id, name FROM artists ORDER BY name",
    ).all<{ id: string; name: string }>();
    return results;
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const artist = await ctx.env.DB.prepare(
        "SELECT id, name FROM artists WHERE id = ?",
      )
        .bind(input.id)
        .first<{ id: string; name: string }>();

      if (!artist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artist not found",
        });
      }

      const { results: artistAlbums } = await ctx.env.DB.prepare(
        `SELECT a.id, a.title, a.cover_key,
				        (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
				 FROM albums a WHERE a.artist_id = ?`,
      )
        .bind(input.id)
        .all<{
          id: string;
          title: string;
          cover_key: string | null;
          song_count: number;
        }>();

      const { results: artistSongs } = await ctx.env.DB.prepare(
        `SELECT s.id, s.title, s.track_number, s.r2_key,
				        s.album_id, a.title as album_title
				 FROM songs s
				 JOIN albums a ON a.id = s.album_id
				 WHERE s.artist_id = ?
				 ORDER BY s.track_number`,
      )
        .bind(input.id)
        .all<{
          id: string;
          title: string;
          track_number: number;
          r2_key: string;
          album_id: string;
          album_title: string;
        }>();

      return {
        id: artist.id,
        name: artist.name,
        albums: artistAlbums.map((a) => ({
          id: a.id,
          title: a.title,
          coverKey: a.cover_key,
          songCount: a.song_count,
        })),
        songs: artistSongs.map((s) => ({
          id: s.id,
          title: s.title,
          trackNumber: s.track_number,
          r2Key: s.r2_key,
          albumId: s.album_id,
          albumTitle: s.album_title,
        })),
      };
    }),
});
