import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";

export default defineConfig({
  plugins: [nodePolyfills(), viteCommonjs()],
  define: {
    "process.env": {
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "f393c7eb287696dc4db76d980cc68328",
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3-open-gaming",
    },
  },
});
