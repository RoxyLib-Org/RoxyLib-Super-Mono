import { albums, artists, lyrics, songs } from "@lib/db";
import { describe, expect, it } from "vitest";

describe("DB Schema", () => {
  it("artists table has expected columns (no coverKey)", () => {
    const columns = Object.keys(artists);
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("description");
    expect(columns).toContain("createdAt");
    // 封面写死前端，不应有 coverKey
    expect(columns).not.toContain("coverKey");
  });

  it("albums table has expected columns (no coverKey)", () => {
    const columns = Object.keys(albums);
    expect(columns).toContain("id");
    expect(columns).toContain("title");
    expect(columns).toContain("artistId");
    expect(columns).toContain("releaseYear");
    expect(columns).toContain("createdAt");
    expect(columns).not.toContain("coverKey");
  });

  it("songs table has expected columns (no coverKey, has r2Key)", () => {
    const columns = Object.keys(songs);
    expect(columns).toContain("id");
    expect(columns).toContain("title");
    expect(columns).toContain("artistId");
    expect(columns).toContain("albumId");
    expect(columns).toContain("trackNumber");
    expect(columns).toContain("duration");
    expect(columns).toContain("r2Key");
    expect(columns).toContain("createdAt");
    expect(columns).not.toContain("coverKey");
  });

  it("lyrics table has expected columns (LRC content)", () => {
    const columns = Object.keys(lyrics);
    expect(columns).toContain("id");
    expect(columns).toContain("songId");
    expect(columns).toContain("content");
    expect(columns).toContain("createdAt");
  });
});
