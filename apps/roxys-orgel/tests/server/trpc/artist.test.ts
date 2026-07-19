import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { artistRouter } from "@/server/trpc/routers/artist";

function parseInput(proc: { _def: { inputs: unknown[] } }, data: unknown) {
  return (proc._def.inputs[0] as z.ZodTypeAny).parse(data);
}

describe("artistRouter", () => {
  it("artist.list has no input schema (no arguments)", () => {
    expect(artistRouter.list._def.inputs).toHaveLength(0);
  });

  it("artist.byId input schema requires id string", () => {
    expect(() => parseInput(artistRouter.byId, { id: "ar1" })).not.toThrow();
    expect(() => parseInput(artistRouter.byId, {})).toThrow();
  });
});
