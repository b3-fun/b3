import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import OnrampExamplePage from "./pages/OnrampExamplePage";
import OnrampFlowPage from "./pages/OnrampFlowPage";
import OnrampOrderStatusPage from "./pages/OnrampOrderStatusPage";
import PlaygroundPage from "./pages/PlaygroundPage";

// Import SDK styles
import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";
import "@b3dotfun/sdk/index.css";

function App() {
  return (
    <B3ProviderWrapper>
      <AnyspendProvider>
        <BrowserRouter>
          <div className="b3-root min-h-screen bg-gray-100">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/onramp-example" element={<OnrampExamplePage />} />
              <Route path="/onramp" element={<OnrampFlowPage />} />
              <Route path="/onramp/status" element={<OnrampOrderStatusPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AnyspendProvider>
    </B3ProviderWrapper>
  );
}

function B3ProviderWrapper({ children }: { children: React.ReactNode }) {
  // Default to light theme since we removed Chakra UI
  const colorMode = "light";
  return (
    <B3Provider environment="production" theme={colorMode} automaticallySetFirstEoa={true}>
      <B3DynamicModal />
      {children}
    </B3Provider>
  );
}

export default App;
