import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __dirname = path.resolve();

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), nodePolyfills(), viteCommonjs()],
    define: {
      "process.env": {
        NEXT_PUBLIC_THIRDWEB_CLIENT_ID: env.VITE_THIRDWEB_CLIENT_ID,
        PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID: env.VITE_GLOBAL_ACCOUNTS_PARTNER_ID,
        NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: env.VITE_THIRDWEB_ECOSYSTEM_ID,
        PUBLIC_B3_API: env.VITE_B3_API,
        NEXT_PUBLIC_DEVMODE_SHARED_SECRET: env.VITE_DEVMODE_SHARED_SECRET,
      },
    },
    resolve: {
      alias: {
        "@b3dotfun/sdk/index.css": path.resolve(__dirname, "../../packages/sdk/dist/styles/index.css"),
        "@b3dotfun/sdk": path.resolve(__dirname, "../../packages/sdk/src"),
      },
    },
  };
});
