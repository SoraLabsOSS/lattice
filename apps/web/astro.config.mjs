// @ts-check

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const require = createRequire(import.meta.url);
const rootDir = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.."
);
const baseUiRoot = path.dirname(require.resolve("@base-ui/react/package.json"));

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
  ],
  site: "https://lattice.soralabs.io.vn/",
  vite: {
    optimizeDeps: {
      include: ["@base-ui/react", "@sora-lattice/ui > @base-ui/react"],
    },
    plugins: [tailwindcss()],
    // Workspace package `@sora-lattice/ui` lives outside apps/web; Vite's module
    // runner otherwise fails to resolve `@base-ui/react/*` deep imports from it.
    resolve: {
      alias: {
        "@base-ui/react": baseUiRoot,
      },
      dedupe: ["react", "react-dom", "@base-ui/react"],
    },
    server: {
      fs: {
        allow: [rootDir],
      },
    },
    ssr: {
      noExternal: ["@sora-lattice/ui", "@base-ui/react"],
    },
  },
});
