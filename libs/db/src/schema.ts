import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const albums = sqliteTable("albums", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artistId: text("artist_id")
    .references(() => artists.id)
    .notNull(),
  releaseYear: integer("release_year"),
  coverKey: text("cover_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artistId: text("artist_id")
    .references(() => artists.id)
    .notNull(),
  albumId: text("album_id")
    .references(() => albums.id)
    .notNull(),
  trackNumber: integer("track_number"),
  duration: integer("duration"),
  r2Key: text("r2_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const lyrics = sqliteTable("lyrics", {
  id: text("id").primaryKey(),
  songId: text("song_id")
    .references(() => songs.id)
    .unique()
    .notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
