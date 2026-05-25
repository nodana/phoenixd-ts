import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: {
    only: true,
  },
  outDir: "dist",
  outExtension: () => ({ dts: ".d.ts" }),
});
