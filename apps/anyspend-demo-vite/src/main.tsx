import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AnyspendProvider>
        <App />
      </AnyspendProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
