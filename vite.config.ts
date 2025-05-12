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
      entry: "src/main.tsx",
      userscript: {
        icon: "https://www.google.com/s2/favicons?sz=64&domain=kolbook.xyz",
        namespace: "https://github.com/StarlessNight13",
        match: ["https://kolbook.xyz/*", "https://cenele.com/*"],
        author: "StarlessNight13",
        downloadURL:
          "https://github.com/StarlessNight13/reading-scripts/releases/download/latest/reading-scripts.user.js",
        updateURL:
          "https://github.com/StarlessNight13/reading-scripts/releases/download/latest/reading-scripts.user.js",
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
