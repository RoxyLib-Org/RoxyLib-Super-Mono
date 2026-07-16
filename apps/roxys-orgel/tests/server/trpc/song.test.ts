import { describe, it, expect } from "vitest";
import type { z } from "zod";
import { songRouter } from "@/server/trpc/routers/song";

function parseInput(proc: { _def: { inputs: unknown[] } }, data: unknown) {
  return (proc._def.inputs[0] as z.ZodTypeAny).parse(data);
}

describe("songRouter", () => {
  it("song.list input schema accepts optional artistId and albumId", () => {
    expect(() => parseInput(songRouter.list, {})).not.toThrow();
    expect(() =>
      parseInput(songRouter.list, { artistId: "a1" }),
    ).not.toThrow();
    expect(() =>
      parseInput(songRouter.list, { albumId: "b1" }),
    ).not.toThrow();
    expect(() =>
      parseInput(songRouter.list, { artistId: "a1", albumId: "b1" }),
    ).not.toThrow();
  });

  it("song.byId input schema requires id string", () => {
    expect(() =>
      parseInput(songRouter.byId, { id: "s1" }),
    ).not.toThrow();
    expect(() => parseInput(songRouter.byId, {})).toThrow();
  });
});
