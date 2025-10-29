import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig(({ command: _command, mode }) => {
  // Load env vars from .env files
  const env = loadEnv(mode, process.cwd(), "");

  // Define default values based on command (serve vs build)
  const defaults =
    // UNDO THIS BEFORE PUSHING
    //  _command === "serve"
    //   ? {
    //       PUBLIC_B3_API: "http://localhost:3031",
    //       PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID: "ceba2f84-45ff-4717-b3e9-0acf0d062abd", // Local dev
    //       NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "eb17a5ec4314526d42fc567821aeb9a6",
    //       NEXT_PUBLIC_DEVMODE_SHARED_SECRET: "k1c4Ep6agmoejiBinKE70B6bzb8vSdm8",
    //       NEXT_PUBLIC_TRANSAK_API_KEY: "d1f4e8be-cacb-4cfa-b2cd-c591084b5ef6",
    //       NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3dotfun",
    //     }
    //   :
    {
      PUBLIC_B3_API: "https://api.b3.fun",
      PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID: "dbcd5e9b-564e-4ba0-91a0-becf0edabb61",
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "f393c7eb287696dc4db76d980cc68328",
      NEXT_PUBLIC_DEVMODE_SHARED_SECRET: "k1c4Ep6agmoejiBinKE70B6bzb8vSdm8",
      NEXT_PUBLIC_TRANSAK_API_KEY: "d1f4e8be-cacb-4cfa-b2cd-c591084b5ef6",
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3-open-gaming",
    };

  // Merge env vars with defaults (.env takes precedence)
  const finalEnv = {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(env).filter(([key]) => key.startsWith("PUBLIC_") || key.startsWith("NEXT_PUBLIC_")),
    ),
  };

  const __dirname = fileURLToPath(new URL(".", import.meta.url));

  return {
    plugins: [react(), nodePolyfills(), viteCommonjs()],
    define: {
      "process.env": finalEnv,
    },
    server: {
      host: true,
      allowedHosts: true,
    },
    preview: {
      allowedHosts: true,
    },
    optimizeDeps: {
      include: [],
      exclude: ["@coinbase/wallet-sdk"],
    },
    resolve: {
      alias: {
        "@b3dotfun/sdk/index.css": path.resolve(__dirname, "../../packages/sdk/dist/styles/index.css"),
        "@b3dotfun/sdk": path.resolve(__dirname, "../../packages/sdk/src"),
      },
    },
  };
});
