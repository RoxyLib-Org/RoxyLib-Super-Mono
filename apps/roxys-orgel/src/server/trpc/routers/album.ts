import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

interface AlbumRow {
  id: string;
  title: string;
  artist_id: string;
  release_year: number | null;
  cover_key: string | null;
  created_at: number;
}


export const albumRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const { results } = await ctx.env.DB.prepare(
      `SELECT a.id, a.title, a.release_year, a.cover_key,
			        ar.name as artist_name
			 FROM albums a
			 JOIN artists ar ON ar.id = a.artist_id
			 ORDER BY a.release_year`,
    ).all<AlbumRow & { artist_name: string }>();

    const albumIds = results.map((a) => `'${a.id}'`).join(",");
    const { results: counts } = await ctx.env.DB.prepare(
      `SELECT album_id, COUNT(*) as cnt FROM songs WHERE album_id IN (${albumIds}) GROUP BY album_id`,
    ).all<{ album_id: string; cnt: number }>();
    const countMap = new Map(counts.map((c) => [c.album_id, c.cnt]));

    return results.map((a) => ({
      id: a.id,
      title: a.title,
      artistName: a.artist_name,
      releaseDate: a.release_year ? String(a.release_year) : null,
      coverUrl: a.cover_key ?? null,
      songCount: countMap.get(a.id) ?? 0,
    }));
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const album = await ctx.env.DB.prepare(
        `SELECT a.id, a.title, a.cover_key,
				        ar.name as artist_name
				 FROM albums a
				 JOIN artists ar ON ar.id = a.artist_id
				 WHERE a.id = ?`,
      )
        .bind(input.id)
        .first<AlbumRow & { artist_name: string }>();

      if (!album) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Album not found" });
      }

      const { results: songs } = await ctx.env.DB.prepare(
        `SELECT id, title, track_number, r2_key
				 FROM songs WHERE album_id = ? ORDER BY track_number`,
      )
        .bind(input.id)
        .all<{
          id: string;
          title: string;
          track_number: number;
          r2_key: string;
        }>();

      return {
        id: album.id,
        title: album.title,
        artistName: album.artist_name,
        coverUrl: album.cover_key ?? null,
        songs: songs.map((s) => ({
          id: s.id,
          title: s.title,
          trackNumber: s.track_number,
          r2Key: s.r2_key,
        })),
      };
    }),
});
