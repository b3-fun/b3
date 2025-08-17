import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __dirname = path.resolve();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), viteCommonjs()],
  define: {
    "process.env": {
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "eb17a5ec4314526d42fc567821aeb9a6",
      PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID: "ceba2f84-45ff-4717-b3e9-0acf0d062abd",
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3dotfun",
      PUBLIC_B3_API: "https://b3-api-development.up.railway.app",
    },
  },
  resolve: {
    alias: {
      "@b3dotfun/sdk/index.css": path.resolve(__dirname, "../../packages/sdk/dist/styles/index.css"),
      "@b3dotfun/sdk": path.resolve(__dirname, "../../packages/sdk/src"),
    },
  },
});
