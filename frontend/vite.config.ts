import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import fs from "fs";
import dotenv from "dotenv";

// Load the root .env file
const rootEnv = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, "../.env"))
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@server": path.resolve(__dirname, "../server"),
    },
  },
  define: {
    // Make HOST_NAME available as a global variable
    "import.meta.env.HOST_NAME": JSON.stringify(rootEnv.HOST_NAME || ""),
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
