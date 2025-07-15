import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import MemoryApp from "./App.tsx";
import BattleApp from "./BattleApp.tsx";
import "./index.css";

const AppComponent = process.env.VITE_APP_TYPE === "battle" ? BattleApp : MemoryApp;

// Update document title
document.title = process.env.VITE_APP_TYPE === "battle" ? "NFT Battle" : "Memory Game";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppComponent />
  </StrictMode>,
);
