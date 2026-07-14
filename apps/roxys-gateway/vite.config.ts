import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config.base";

const config = defineConfig({
  plugins: [
    cloudflare({ configPath: path.resolve(__dirname, "./wrangler.toml") }),
  ],
});

export default mergeConfig(config, baseConfig);
