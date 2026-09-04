import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  clearScreen: false,
  test: {
    globals: false,
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/features/_template/**"],
        },
      },
      {
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
        },
      },
    ],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
