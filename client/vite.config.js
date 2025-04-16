import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import svgr from "vite-plugin-svelte-svgr";

export default defineConfig({
  plugins: [svelte({}), svgr()],
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
