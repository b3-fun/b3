/**
 * B3 Widget SDK
 * Based on: https://dev.to/giologist/creating-react-widgets-that-can-be-embedded-on-any-website-by-anyone-1mdg
 */

// Import full styles including Tailwind
import "./styles.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { B3DynamicModal, B3Provider, SignInWithB3 } from "../global-account/react";

console.log("[B3Widget] Loaded");

// Find all widget divs and inject React
function init(config: any = {}) {
  console.log("[B3Widget] Initializing");

  const widgetDivs = document.querySelectorAll(".b3-sign-in-widget");

  // Inject our React App into each
  widgetDivs.forEach(div => {
    const root = createRoot(div);
    root.render(
      <React.StrictMode>
        <B3Provider
          partnerId={config.partnerId || ""}
          environment={config.environment || "production"}
          theme={config.theme || "light"}
        >
          <SignInWithB3 partnerId={config.partnerId || ""} chain={null as any} />
          <B3DynamicModal />
        </B3Provider>
      </React.StrictMode>,
    );
  });

  console.log("[B3Widget] Done");
}

// Expose globally
if (typeof window !== "undefined") {
  (window as any).B3Widget = { init };
  console.log("[B3Widget] Ready");
}
