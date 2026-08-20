import { defineConfig } from "vite";
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
