import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import { ANYSPEND_MAINNET_BASE_URL } from "@b3dotfun/sdk/anyspend/constants";
import React from "react";

console.log("[anyspend-demo] API base URL:", ANYSPEND_MAINNET_BASE_URL);
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CheckoutPage from "./pages/CheckoutPage";
import GasFundingPage from "./pages/GasFundingPage";
import HomePage from "./pages/HomePage";
import OnrampExamplePage from "./pages/OnrampExamplePage";
import OnrampFlowPage from "./pages/OnrampFlowPage";
import OnrampOrderStatusPage from "./pages/OnrampOrderStatusPage";
import StatePreviewPage from "./pages/StatePreviewPage";
import { ThemeProvider, useTheme } from "./ThemeContext";

// Import SDK styles
import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";
import "@b3dotfun/sdk/index.css";

function App() {
  return (
    <ThemeProvider>
      <B3ProviderWrapper>
        <AnyspendProvider>
          <BrowserRouter>
            <div className="b3-root min-h-screen">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/gas-funding" element={<GasFundingPage />} />
                <Route path="/onramp-example" element={<OnrampExamplePage />} />
                <Route path="/onramp" element={<OnrampFlowPage />} />
                <Route path="/onramp/status" element={<OnrampOrderStatusPage />} />
                <Route path="/preview" element={<StatePreviewPage />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AnyspendProvider>
      </B3ProviderWrapper>
    </ThemeProvider>
  );
}

function B3ProviderWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <B3Provider
      environment="production"
      theme={theme}
      automaticallySetFirstEoa={true}
      partnerId={String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
    >
      <B3DynamicModal />
      {children}
    </B3Provider>
  );
}

export default App;
