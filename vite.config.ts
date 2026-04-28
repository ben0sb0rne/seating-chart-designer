import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On GitHub Pages the app is served from /<repo-name>/, so assets need that prefix.
// Locally and on hosts that serve from root, we want "/".
// Set GH_PAGES=true (or rely on GITHUB_ACTIONS=true) to flip the base path at build time.
const repoName = "seating-chart-designer";
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true" || process.env.GH_PAGES === "true";

export default defineConfig({
  base: isGitHubPagesBuild ? `/${repoName}/` : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { port: 5173, open: true },
});
