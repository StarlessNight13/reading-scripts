import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import monkey, { cdn } from "vite-plugin-monkey";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        icon: "https://www.google.com/s2/favicons?sz=64&domain=kolnovel.com",
        namespace: "https://github.com/StarlessNight13",
        match: ["https://kolnovel.com/*", "https://cenele.com/*"],
        author: "StarlessNight13",
        downloadURL:
          "https://github.com/StarlessNight13/reading-scripts/releases/latest/download/reading-scripts.user.js",
        updateURL:
          "https://github.com/StarlessNight13/reading-scripts/releases/latest/download/reading-scripts.user.js",
      },
      server: {
        open: false,
      },
      build: {
        externalGlobals: {
          react: cdn.jsdelivr("React", "umd/react.production.min.js"),
          "react-dom": cdn.jsdelivr(
            "ReactDOM",
            "umd/react-dom.production.min.js"
          ),
        },
      },
    }),
  ],
});
