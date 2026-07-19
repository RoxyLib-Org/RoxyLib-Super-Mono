import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import type { HonoCtxEnv } from "@/shared/types";
import { audioRoute } from "@/server/apis/audio";
import { encodeId } from "@/server/utils/r2-scanner";

const TEST_KEY = "S1/Test Album - Test Artist/01. Test Song.flac";
const TEST_ENCODED = encodeId(TEST_KEY);
const MISSING_KEY = "S1/nonexistent/99. Ghost.flac";
const MISSING_ENCODED = encodeId(MISSING_KEY);

let env: CloudflareBindings;
let dispose: () => Promise<void>;

beforeAll(async () => {
  const proxy = await getPlatformProxy<CloudflareBindings>({
    configPath: "apps/roxys-orgel/wrangler.toml",
  });
  env = proxy.env;
  dispose = proxy.dispose;

  // Seed a 1024-byte test file into local R2
  const fixture = readFileSync(
    resolve(__dirname, "../../fixtures/test-audio.flac"),
  );
  await env.R2.put(TEST_KEY, fixture, {
    httpMetadata: { contentType: "audio/flac" },
  });
});

afterAll(async () => {
  // Clean up seeded object
  await env.R2.delete(TEST_KEY);
  await dispose();
});

const app = new Hono<HonoCtxEnv>().route("/", audioRoute);

describe("GET /api/audio/:encodedKey", () => {
  it("returns 404 when file does not exist in R2", async () => {
    const res = await app.request(`/api/audio/${MISSING_ENCODED}`, {}, env);
    expect(res.status).toBe(404);
  });

  it("returns 200 with Content-Length and Accept-Ranges when no Range header", async () => {
    const res = await app.request(`/api/audio/${TEST_ENCODED}`, {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Length")).toBe("1024");
  });

  it("returns 206 with Content-Range for valid Range request", async () => {
    const res = await app.request(
      `/api/audio/${TEST_ENCODED}`,
      { headers: { Range: "bytes=0-99" } },
      env,
    );
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 0-99/1024");
    expect(res.headers.get("Content-Length")).toBe("100");
  });

  it("returns 206 for open-ended Range (bytes=500-)", async () => {
    const res = await app.request(
      `/api/audio/${TEST_ENCODED}`,
      { headers: { Range: "bytes=500-" } },
      env,
    );
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 500-1023/1024");
    expect(res.headers.get("Content-Length")).toBe("524");
  });

  it("returns 416 for unsatisfiable Range (start >= size)", async () => {
    const res = await app.request(
      `/api/audio/${TEST_ENCODED}`,
      { headers: { Range: "bytes=2000-3000" } },
      env,
    );
    expect(res.status).toBe(416);
  });

  it("returns 400 for malformed Range header", async () => {
    const res = await app.request(
      `/api/audio/${TEST_ENCODED}`,
      { headers: { Range: "invalid" } },
      env,
    );
    expect(res.status).toBe(400);
  });
});
