/**
 * B3 Widget SDK
 * Based on: https://dev.to/giologist/creating-react-widgets-that-can-be-embedded-on-any-website-by-anyone-1mdg
 */

// Import full styles including Tailwind
import "./styles.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { B3Provider, SignInWithB3 } from "../global-account/react";
import { DebugModal } from "./DebugModal";
import { b3TestnetThirdWeb, b3MainnetThirdWeb } from "../shared/constants/chains/supported";

console.log("[B3Widget] Loaded");

// Find all widget divs and inject React
function init(config: any = {}) {
  console.log("[B3Widget] Initializing with config:", config);

  const widgetDivs = document.querySelectorAll(".b3-sign-in-widget");
  console.log("[B3Widget] Found", widgetDivs.length, "widget divs");

  // Inject our React App into each
  widgetDivs.forEach((div, index) => {
    console.log(`[B3Widget] Rendering widget ${index + 1}`);
    
    // Use appropriate chain based on environment
    const chain = config.environment === "production" ? b3MainnetThirdWeb : b3TestnetThirdWeb;
    
    const root = createRoot(div);
    root.render(
      <React.StrictMode>
        <B3Provider
          partnerId={config.partnerId || ""}
          environment={config.environment || "development"}
          theme={config.theme || "light"}
          automaticallySetFirstEoa={true}
          onConnect={(wallet) => {
            console.log("[B3Widget] Wallet connected:", wallet);
            config.onWalletConnected?.(wallet);
          }}
        >
          <SignInWithB3 
            partnerId={config.partnerId || ""} 
            chain={chain}
            buttonText="Sign in with B3"
          />
          <DebugModal />
        </B3Provider>
      </React.StrictMode>,
    );
  });

  console.log("[B3Widget] All widgets rendered");
}

// Expose globally
if (typeof window !== "undefined") {
  (window as any).B3Widget = { init };
  console.log("[B3Widget] Ready - window.B3Widget.init() available");
}
