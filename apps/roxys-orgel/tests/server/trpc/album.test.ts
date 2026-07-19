import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { albumRouter } from "@/server/trpc/routers/album";

function parseInput(proc: { _def: { inputs: unknown[] } }, data: unknown) {
  return (proc._def.inputs[0] as z.ZodTypeAny).parse(data);
}

describe("albumRouter", () => {
  it("album.list has no input schema (no arguments)", () => {
    expect(albumRouter.list._def.inputs).toHaveLength(0);
  });

  it("album.byId input schema requires id string", () => {
    expect(() => parseInput(albumRouter.byId, { id: "a1" })).not.toThrow();
    expect(() => parseInput(albumRouter.byId, {})).toThrow();
  });
});
