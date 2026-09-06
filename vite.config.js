import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Italiano — learn Italian",
        short_name: "Italiano",
        description: "Vocabulary, grammar, conversations and stories for learning Italian.",
        theme_color: "#1C3F4A",
        background_color: "#F5F1E6",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"]
      }
    })
  ],
  test: {
    environment: "jsdom",
    // Agent worktrees live at .claude/worktrees/<name>, and each one is a
    // full checkout: its own src/, its own *.test.jsx, its own node_modules.
    // Git ignores a registered worktree automatically, so `git status` stays
    // clean and nothing warns you — but vitest's default discovery walked
    // straight into them, collected every branch's copy of the suite, and ran
    // them against this checkout's node_modules. The visible symptom was
    // `npm test` reporting 178 files and 488 failures on a tree where the
    // app's own 47 files were green, on main as much as on a branch.
    //
    // CLAUDE.md requires a green `npm test` before any change is called done,
    // so a discovery bug that makes that command meaningless is worth a line
    // of config. configDefaults.exclude is spread rather than replaced —
    // writing a bare array here silently drops node_modules and dist.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
    setupFiles: ["./src/test/setup.js"],
    globals: true,
    // Vitest's 5s default is measured against a single render; several tests
    // here click through a whole deck (24-odd userEvent interactions), and
    // under v8 coverage instrumentation that alone runs past five seconds.
    // The suite's own tests take ~10s in total — this ceiling only exists to
    // stop a slow machine reporting a timeout as a failure.
    testTimeout: 20000,
    coverage: {
      // Everything the app actually ships. main.jsx is the two-line React
      // mount and src/test/ is the harness itself — neither is app behaviour,
      // and counting them would only ever dilute the number.
      // Scoped to source files: "src/**" also hands the reporter whatever
      // else lands in the tree (a stray .DS_Store), which it then tries to
      // parse as JavaScript.
      include: ["src/**/*.{js,jsx}"],
      exclude: ["**/*.test.{js,jsx}", "src/test/**", "src/main.jsx"],
      // The suite is at 100% on all four metrics; this keeps it there rather
      // than letting it quietly erode. Lower a threshold deliberately if a
      // branch genuinely isn't worth reaching, don't delete the block.
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 }
    }
  }
});
