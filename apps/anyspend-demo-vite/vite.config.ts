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
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "f393c7eb287696dc4db76d980cc68328",
      PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID: "dbcd5e9b-564e-4ba0-91a0-becf0edabb61",
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3-open-gaming",
      PUBLIC_B3_API: "https://api.b3.fun",
      NEXT_PUBLIC_DEVMODE_SHARED_SECRET: "k1c4Ep6agmoejiBinKE70B6bzb8vSdm8",
    },
  },
  resolve: {
    alias: {
      "@b3dotfun/sdk/index.css": path.resolve(__dirname, "../../packages/sdk/dist/styles/index.css"),
      "@b3dotfun/sdk": path.resolve(__dirname, "../../packages/sdk/src"),
    },
  },
});
