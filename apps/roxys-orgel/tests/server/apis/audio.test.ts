import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HonoCtxEnv } from "@/shared/types";

// Mock @lib/db BEFORE importing the route
const mockDbSelect = vi.fn();
const mockDbFrom = vi.fn(() => ({ where: mockDbWhere }));
const mockDbWhere = vi.fn();

vi.mock("@lib/db", () => ({
  default: vi.fn(() => ({
    select: mockDbSelect,
  })),
  songs: { id: { name: "id" }, r2Key: { name: "r2_key" } },
  eq: vi.fn((a: unknown, b: unknown) => ({ type: "eq", left: a, right: b })),
}));

// Import after mock
const { audioRoute } = await import("@/server/apis/audio");

const mockR2Head = vi.fn();
const mockR2Get = vi.fn();

function buildEnv(overrides: {
  dbResult?: unknown[];
  headResult?: unknown;
  getResult?: unknown;
}): CloudflareBindings {
  mockDbSelect.mockReturnValue({ from: mockDbFrom });
  mockDbWhere.mockReset();
  mockR2Head.mockReset();
  mockR2Get.mockReset();

  mockDbWhere.mockResolvedValue(
    "dbResult" in overrides
      ? overrides.dbResult
      : [{ id: "s1", r2Key: "music/s1.mp3" }],
  );
  mockR2Head.mockResolvedValue(
    "headResult" in overrides
      ? overrides.headResult
      : {
          size: 1024,
          httpMetadata: { contentType: "audio/mpeg" },
        },
  );
  mockR2Get.mockResolvedValue(
    "getResult" in overrides
      ? overrides.getResult
      : {
          body: new ReadableStream(),
          httpMetadata: { contentType: "audio/mpeg" },
          size: 1024,
        },
  );

  return {
    DB: {} as D1Database,
    R2: { head: mockR2Head, get: mockR2Get } as unknown as R2Bucket,
    KV: {} as KVNamespace,
  };
}

const app = new Hono<HonoCtxEnv>().route("/", audioRoute);

describe("GET /api/audio/:songId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when song not found in DB", async () => {
    mockDbWhere.mockResolvedValue([]);
    const res = await app.request(
      "/api/audio/nonexistent",
      {},
      buildEnv({ dbResult: [] }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when R2 head returns null (file missing)", async () => {
    const res = await app.request(
      "/api/audio/s1",
      {},
      buildEnv({ headResult: null }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 with Content-Length and Accept-Ranges when no Range header", async () => {
    const res = await app.request("/api/audio/s1", {}, buildEnv({}));
    expect(res.status).toBe(200);
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Length")).toBe("1024");
    expect(mockR2Head).toHaveBeenCalledWith("music/s1.mp3");
    expect(mockR2Get).toHaveBeenCalledWith("music/s1.mp3");
  });

  it("returns 206 with Content-Range for valid Range request", async () => {
    const res = await app.request(
      "/api/audio/s1",
      { headers: { Range: "bytes=0-99" } },
      buildEnv({}),
    );
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 0-99/1024");
    expect(res.headers.get("Content-Length")).toBe("100");
    expect(mockR2Get).toHaveBeenCalledWith("music/s1.mp3", {
      range: { offset: 0, length: 100 },
    });
  });

  it("returns 206 for open-ended Range (bytes=500-)", async () => {
    const res = await app.request(
      "/api/audio/s1",
      { headers: { Range: "bytes=500-" } },
      buildEnv({}),
    );
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 500-1023/1024");
    expect(res.headers.get("Content-Length")).toBe("524");
    expect(mockR2Get).toHaveBeenCalledWith("music/s1.mp3", {
      range: { offset: 500, length: 524 },
    });
  });

  it("returns 416 for unsatisfiable Range (start >= size)", async () => {
    const res = await app.request(
      "/api/audio/s1",
      { headers: { Range: "bytes=2000-3000" } },
      buildEnv({}),
    );
    expect(res.status).toBe(416);
    expect(mockR2Get).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed Range header", async () => {
    const res = await app.request(
      "/api/audio/s1",
      { headers: { Range: "invalid" } },
      buildEnv({}),
    );
    expect(res.status).toBe(400);
  });
});
