import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    sourcemap: true,
    clean: true,
    outDir: "dist",
    outExtension: () => ({ js: ".js" }),
  },
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    sourcemap: true,
    clean: false,
    outDir: "dist/cjs",
    outExtension: () => ({ js: ".js" }),
  },
]);
