import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { encodeId } from "@/server/utils/r2-scanner";
import { publicProcedure, router } from "../trpc";

function coverKeyToUrl(key: string | null): string | null {
  if (!key) return null;
  return `/api/cover/${encodeId(key)}`;
}

interface SongRow {
  id: string;
  title: string;
  track_number: number;
  duration: number | null;
  r2_key: string;
  album_id: string;
  album_title: string;
  artist_name: string;
  cover_key: string | null;
}

export const songRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          albumId: z.string().optional(),
        })
        .optional()
        .default({}),
    )
    .query(async ({ input, ctx }) => {
      const baseQuery = `
				SELECT s.id, s.title, s.track_number, s.duration, s.r2_key,
				       s.album_id, a.title as album_title,
				       ar.name as artist_name, a.cover_key
				FROM songs s
				JOIN albums a ON a.id = s.album_id
				JOIN artists ar ON ar.id = s.artist_id
			`;

      let results: SongRow[];
      if (input.albumId) {
        const resp = await ctx.env.DB.prepare(
          `${baseQuery} WHERE s.album_id = ? ORDER BY s.track_number`,
        )
          .bind(input.albumId)
          .all<SongRow>();
        results = resp.results;
      } else {
        const resp = await ctx.env.DB.prepare(
          `${baseQuery} ORDER BY s.album_id, s.track_number`,
        ).all<SongRow>();
        results = resp.results;
      }

      return results.map((s) => ({
        id: s.id,
        title: s.title,
        trackNumber: s.track_number,
        r2Key: s.r2_key,
        albumId: s.album_id,
        albumTitle: s.album_title,
        artistName: s.artist_name,
        durationMs: s.duration ? s.duration * 1000 : null,
        coverUrl: coverKeyToUrl(s.cover_key),
      }));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const song = await ctx.env.DB.prepare(
        `SELECT s.id, s.title, s.track_number, s.duration, s.r2_key,
				        s.album_id, a.title as album_title,
				        ar.name as artist_name, a.cover_key
				 FROM songs s
				 JOIN albums a ON a.id = s.album_id
				 JOIN artists ar ON ar.id = s.artist_id
				 WHERE s.id = ?`,
      )
        .bind(input.id)
        .first<SongRow>();

      if (!song) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      }

      return {
        id: song.id,
        title: song.title,
        trackNumber: song.track_number,
        r2Key: song.r2_key,
        albumId: song.album_id,
        albumTitle: song.album_title,
        artistName: song.artist_name,
        durationMs: song.duration ? song.duration * 1000 : null,
        coverUrl: coverKeyToUrl(song.cover_key),
      };
    }),

  lyrics: publicProcedure
    .input(z.object({ songId: z.string() }))
    .query(async ({ input, ctx }) => {
      const row = await ctx.env.DB.prepare(
        "SELECT content FROM lyrics WHERE song_id = ?",
      )
        .bind(input.songId)
        .first<{ content: string }>();

      if (!row) return [];

      // Parse LRC format: [mm:ss.xx]text
      return row.content
        .split("\n")
        .filter((line) => line.startsWith("["))
        .map((line) => {
          const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
          if (!match) return null;
          const minutes = Number.parseInt(match[1], 10);
          const seconds = Number.parseInt(match[2], 10);
          const centis = Number.parseInt(match[3], 10);
          return {
            time: minutes * 60 + seconds + centis / 100,
            text: match[4],
          };
        })
        .filter((x): x is { time: number; text: string } => x !== null);
    }),
});
