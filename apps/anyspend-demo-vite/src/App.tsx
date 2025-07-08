import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import { useColorMode } from "@chakra-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import OnrampExamplePage from "./pages/OnrampExamplePage";
import OnrampFlowPage from "./pages/OnrampFlowPage";
import OnrampOrderStatusPage from "./pages/OnrampOrderStatusPage";

// Import SDK styles
import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";
import "@b3dotfun/sdk/index.css";

const queryClient = new QueryClient();

function App() {
  return (
    <B3ProviderWrapper>
      <AnyspendProvider>
        <BrowserRouter>
          <div className="b3-root min-h-screen bg-gray-100">
            <Routes>
              <Route path="/" element={<HomePage />} />
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
  const { colorMode } = useColorMode();
  return (
    <B3Provider isMainnetAnySpend={true} environment="production" theme={colorMode} automaticallySetFirstEoa={true}>
      <B3DynamicModal />
      {children}
    </B3Provider>
  );
}

export default App;
