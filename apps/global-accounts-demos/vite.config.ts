import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Define app types for type safety
type AppType = "default" | "battle";

// Define app-specific configurations
const appConfigs: Record<
  AppType,
  {
    title: string;
    favicon: string;
  }
> = {
  default: {
    title: "Memory Game",
    favicon: "fav.ico"
  },
  battle: {
    title: "NFT Battle",
    favicon: "fav2.ico"
  }
};

const appType = (process.env.VITE_APP_TYPE || "default") as AppType;

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  let env = {};
  console.log("@@command345", command);
  if (command === "serve") {
    env = {
      PUBLIC_B3_API: "http://localhost:3031",
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "eb17a5ec4314526d42fc567821aeb9a6",
      NEXT_PUBLIC_DEVMODE_SHARED_SECRET: "k1c4Ep6agmoejiBinKE70B6bzb8vSdm8",
      NEXT_PUBLIC_TRANSAK_API_KEY: "d1f4e8be-cacb-4cfa-b2cd-c591084b5ef6",
      VITE_APP_TYPE: process.env.VITE_APP_TYPE || "default",
      VITE_APP_TITLE: appConfigs[appType].title,
      VITE_APP_FAVICON: appConfigs[appType].favicon,
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3dotfun",
      PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID: "ceba2f84-45ff-4717-b3e9-0acf0d062abd" // Local dev
    };
  } else {
    env = {
      PUBLIC_B3_API: "https://api.b3.fun",
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "f393c7eb287696dc4db76d980cc68328",
      NEXT_PUBLIC_DEVMODE_SHARED_SECRET: "k1c4Ep6agmoejiBinKE70B6bzb8vSdm8",
      NEXT_PUBLIC_TRANSAK_API_KEY: "d1f4e8be-cacb-4cfa-b2cd-c591084b5ef6",
      VITE_APP_TYPE: process.env.VITE_APP_TYPE || "default",
      VITE_APP_TITLE: appConfigs[appType].title,
      VITE_APP_FAVICON: appConfigs[appType].favicon,
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3-open-gaming",
      PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID: "dbcd5e9b-564e-4ba0-91a0-becf0edabb61"
    };
  }

  return {
    plugins: [react(), nodePolyfills(), viteCommonjs()],
    define: {
      "process.env": env
    },
    preview: {
      allowedHosts: ["memory-game-production-ea41.up.railway.app", "battle-nft-production.up.railway.app"]
    },
    optimizeDeps: {
      include: [],
      exclude: []
    },
    resolve: {
      alias: {
        "@b3dotfun/sdk/index.css": path.resolve(__dirname, "../../packages/sdk/dist/styles/index.css"),
        "@b3dotfun/sdk": path.resolve(__dirname, "../../packages/sdk/src")
      }
    }
  };
});
