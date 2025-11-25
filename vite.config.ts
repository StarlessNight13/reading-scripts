import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        icon: "https://www.google.com/s2/favicons?sz=64&domain=kolnovel.com",
        namespace: "starlessNight13/reading-scripts",
        match: ["https://kolnovel.com/*", "https://cenele.com/*"],
        author: "StarlessNight13",
        downloadURL:
          "https://github.com/StarlessNight13/reading-scripts/releases/latest/download/reading-scripts.user.js",
        updateURL:
          "https://github.com/StarlessNight13/reading-scripts/releases/latest/download/reading-scripts.user.js",
      },
      build: {
        externalResource: {
          "https://crystal-ui.com/v1/crystal-ui.css": "crystal-ui.css",
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
