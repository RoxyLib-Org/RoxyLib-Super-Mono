import { describe, it, expect } from "vitest";
import type { z } from "zod";
import { albumRouter } from "@/server/trpc/routers/album";

function parseInput(proc: { _def: { inputs: unknown[] } }, data: unknown) {
  return (proc._def.inputs[0] as z.ZodTypeAny).parse(data);
}

describe("albumRouter", () => {
  it("album.list input schema accepts empty object", () => {
    expect(() => parseInput(albumRouter.list, {})).not.toThrow();
  });

  it("album.byId input schema requires id string", () => {
    expect(() =>
      parseInput(albumRouter.byId, { id: "a1" }),
    ).not.toThrow();
    expect(() => parseInput(albumRouter.byId, {})).toThrow();
  });
});
