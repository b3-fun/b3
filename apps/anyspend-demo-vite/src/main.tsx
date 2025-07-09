import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AnyspendProvider>
      <App />
    </AnyspendProvider>
  </React.StrictMode>,
);
