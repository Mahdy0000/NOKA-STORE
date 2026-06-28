import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
const rawPort = process.env.PORT;

const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH || "/";

const onReplit = !!process.env.REPL_ID;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    ...(onReplit
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default(),
          ),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: rawPort ? {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": `http://localhost:${Number(rawPort) + 1}`,
      "/uploads": `http://localhost:${Number(rawPort) + 1}`,
    },
  } : undefined,
  preview: rawPort ? {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  } : undefined,
});
