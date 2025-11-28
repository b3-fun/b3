/**
 * Widget Renderer - Sets up global window.B3Widget API
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { B3DynamicModal, B3Provider, SignInWithB3 } from "../global-account/react";
import { b3MainnetThirdWeb } from "../shared/constants/chains/supported";

console.log("[B3Widget] Script loaded!");

// Global API
const B3Widget = {
  init(config: any) {
    console.log("[B3Widget.init] Called with:", config);

    // Find all sign-in widgets
    const signInDivs = document.querySelectorAll('[data-b3-widget="sign-in"]');
    console.log("[B3Widget] Found", signInDivs.length, "sign-in widget(s)");

    signInDivs.forEach(div => {
      const root = createRoot(div);
      root.render(
        <React.StrictMode>
          <B3Provider
            theme={config.theme || "light"}
            environment={config.environment || "production"}
            partnerId={config.partnerId || ""}
            automaticallySetFirstEoa={config.automaticallySetFirstEoa}
            onConnect={wallet => {
              console.log("[B3Widget] Wallet connected:", wallet);
              config.onWalletConnected?.(wallet);
            }}
          >
            <SignInWithB3 partnerId={config.partnerId || ""} chain={b3MainnetThirdWeb} />
            <B3DynamicModal />
          </B3Provider>
        </React.StrictMode>,
      );
    });

    console.log("[B3Widget] Initialization complete");
  },
};

// Expose globally
if (typeof window !== "undefined") {
  (window as any).B3Widget = B3Widget;
  console.log("[B3Widget] window.B3Widget ready!");
}

// Export for IIFE return value
export default B3Widget;
