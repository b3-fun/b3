import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), viteCommonjs()],
  define: {
    "process.env": {
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "eb17a5ec4314526d42fc567821aeb9a6",
      NEXT_PUBLIC_DEVMODE_SHARED_SECRET: "k1c4Ep6agmoejiBinKE70B6bzb8vSdm8",
      NEXT_PUBLIC_TRANSAK_API_KEY: "d1f4e8be-cacb-4cfa-b2cd-c591084b5ef6",
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3dotfun",
      NEXT_PUBLIC_THIRDWEB_PARTNER_ID: "ceba2f84-45ff-4717-b3e9-0acf0d062abd",
    },
  },
  preview: {
    allowedHosts: ["global-accounts-production.up.railway.app", "global.b3.fun"],
  },
  optimizeDeps: {
    include: [
      "@privy-io/public-api",
      "@privy-io/react-auth",
      "@walletconnect",
      "@walletconnect/environment",
      "@walletconnect/time",
      "@walletconnect/logger",
      "@walletconnect/types",
      "@walletconnect/utils",
      "@walletconnect/core",
      "@walletconnect/sign-client",
      "debug",
      "hash.js",
    ],
    exclude: ["@b3dotfun/sdk", "thirdweb/react", "@radix-ui/react-slot"],
  },
  resolve: {
    alias: {
      "@b3dotfun/sdk/index.css": path.resolve(__dirname, "../../packages/sdk/dist/styles/index.css"),
      "@b3dotfun/sdk": path.resolve(__dirname, "../../packages/sdk/src"),
    },
  },
});
