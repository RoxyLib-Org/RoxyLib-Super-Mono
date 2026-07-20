import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig, mergeConfig } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";
import baseConfig from "../../vite.config.base";

// Rolldown emits `__require("assert")` etc. for CJS deps in Workers ESM.
// nodejs_compat_v2 makes `node:module` createRequire available — inject a
// global `require` shim so CJS wrappers resolve Node builtins correctly.
function workerRequireShim() {
  return {
    name: "worker-require-shim",
    applyToEnvironment(environment: { name: string }) {
      return environment.name !== "client";
    },
    renderChunk(code: string) {
      if (!code.includes("__require")) return null;
      const shim = `import{createRequire as __cr}from"node:module";var require=__cr("file:///worker.mjs");\n`;
      return { code: shim + code, map: null };
    },
  };
}
const PROD_ORIGIN = "https://orgel.roxylib.com";

/**
 * Dev-only plugin: intercepts /api/audio/* and /api/cover/* at the Node.js
 * level and proxies them to production. This bypasses workerd's local R2
 * (which is empty in dev) by handling the request before it reaches miniflare.
 */
function r2DevProxy(): Plugin {
  return {
    name: "r2-dev-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (
          !url.startsWith("/api/audio/") &&
          !url.startsWith("/api/cover/")
        ) {
          return next();
        }

        // For /api/cover/:key — decode key; if it's an external URL, proxy directly
        if (url.startsWith("/api/cover/")) {
          const encodedKey = url.slice("/api/cover/".length).split("?")[0];
          try {
            const fixed = encodedKey.replace(/-/g, "+").replace(/_/g, "/");
            const decoded = Buffer.from(fixed, "base64").toString("utf-8");
            if (
              decoded.startsWith("http://") ||
              decoded.startsWith("https://")
            ) {
              // Proxy directly to the external cover URL
              fetch(decoded, { redirect: "follow" })
                .then((resp) => {
                  if (!resp.ok) {
                    res.statusCode = resp.status;
                    res.end(`Cover upstream returned ${resp.status}`);
                    return;
                  }
                  res.statusCode = 200;
                  const ct = resp.headers.get("content-type");
                  if (ct) res.setHeader("Content-Type", ct);
                  res.setHeader("Cache-Control", "public, max-age=604800");
                  if (!resp.body) {
                    res.end();
                    return;
                  }
                  const reader = resp.body.getReader();
                  function pump() {
                    reader.read().then(({ done, value }) => {
                      if (done) {
                        res.end();
                        return;
                      }
                      res.write(value);
                      pump();
                    });
                  }
                  pump();
                })
                .catch(() => {
                  res.statusCode = 502;
                  res.end("Cover proxy: external upstream unreachable");
                });
              return;
            }
          } catch {
            // decode failed — fall through to production proxy
          }
        }

        // Default: proxy to production
        const upstream = `${PROD_ORIGIN}${url}`;
        const headers: Record<string, string> = {};
        if (req.headers.range) headers.Range = req.headers.range;

        fetch(upstream, { headers })
          .then((resp) => {
            res.statusCode = resp.status;
            for (const [k, v] of resp.headers.entries()) {
              if (k === "transfer-encoding" || k === "connection") continue;
              res.setHeader(k, v);
            }
            if (!resp.body) {
              res.end();
              return;
            }
            const reader = resp.body.getReader();
            function pump() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  res.end();
                  return;
                }
                res.write(value);
                pump();
              });
            }
            pump();
          })
          .catch(() => {
            res.statusCode = 502;
            res.end("R2 dev proxy: upstream unreachable");
          });
      });
    },
  };
}

const config = defineConfig({
  plugins: [
    r2DevProxy(),
    tailwindcss(),
    tanstackRouter({
      target: "react",
      routeTreeFileHeader: [
        "// biome-ignore-all lint: gen",
        "/* eslint-disable */",
        "// @ts-nocheck",
      ],
      autoCodeSplitting: true,
      routeFileIgnorePattern: ".*/__tests__/.*",
      routesDirectory: path.resolve(__dirname, "./src/apps/routers"),
      generatedRouteTree: path.resolve(
        __dirname,
        "./src/apps/routeTree.gen.ts",
      ),
    }),
    cloudflare({ configPath: path.resolve(__dirname, "./wrangler.toml") }),
    ssrPlugin({
      hotReload: {
        ignore: ["./src/client/**/*.tsx", "./src/apps/**/*.tsx"],
      },
    }),
    react(),
    workerRequireShim(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

export default mergeConfig(config, baseConfig);
