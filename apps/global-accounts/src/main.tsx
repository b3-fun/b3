import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import "@b3dotfun/sdk/index.css";
import "./index.css";

localStorage.setItem("debug", "@@b3dotfun/sdk**");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
