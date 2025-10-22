import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";
import SignIn from "@b3dotfun/sdk/global-account/react/components/SignInWithB3/SignIn";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { CodeExample } from "./components/CodeExample";
import { Features } from "./components/Features";
import { Hero } from "./components/Hero";
import { NFTMintingExample } from "./components/NFTMintingExample";
import { RequestPermissionsExample } from "./components/RequestPermissionsExample";
import { b3Chain } from "./constants/b3Chain";
import { Debug } from "./pages/Debug";
import { Demos } from "./pages/Demos";
import { queryClient } from "./utils/queryClient";
import type { Wallet } from "./utils/wallet";
import { generateWallet } from "./utils/wallet";

function MainContent({ wallet, isEmbedded }: { wallet: Wallet; isEmbedded: boolean }) {
  return (
    <main className={isEmbedded ? "" : "pt-16"}>
      <Hero wallet={wallet} />
      <Features />
      <CodeExample />
      <RequestPermissionsExample wallet={wallet} />
      <NFTMintingExample />
    </main>
  );
}

function App() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    const generateLocalWallet = async () => {
      const wallet = await generateWallet();
      setWallet(wallet);
    };
    generateLocalWallet();
  }, []);

  // Check if embedded mode (hide header in iframes)
  const isEmbedded = new URLSearchParams(window.location.search).get("embedded") === "true";

  return (
    <QueryClientProvider client={queryClient}>
      <B3Provider
        environment="production"
        theme="light"
        partnerId={String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
      >
        <BrowserRouter>
          <B3DynamicModal />
          <div className="min-h-screen bg-white">
            {!isEmbedded && (
              <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                <nav className="container mx-auto flex h-16 items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <Link to="/">
                      <img src="https://cdn.b3.fun/b3_logo@.png" alt="B3 Logo" className="h-8" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-8">
                    <Link to="/demos" className="text-b3-grey hover:text-b3-blue font-neue-montreal transition-colors">
                      Demos
                    </Link>
                    <Link to="/debug" className="text-b3-grey hover:text-b3-blue font-neue-montreal transition-colors">
                      Debug
                    </Link>
                    <a
                      href="https://docs.b3.fun"
                      className="text-b3-grey hover:text-b3-blue font-neue-montreal transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Docs
                    </a>
                    <a
                      href="https://github.com/b3-fun"
                      className="text-b3-grey hover:text-b3-blue font-neue-montreal transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                    <div>
                      <SignIn
                        chain={b3Chain}
                        partnerId={String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
                        // closeAfterLogin={true}
                        onLoginSuccess={async (globalAccount: any) => {
                          console.log("User authenticated with Global Account!", globalAccount);
                        }}
                        onError={async (error: Error) => {
                          console.error("Error signing in:", error);
                        }}
                        sessionKeyAddress={wallet?.address as `0x${string}`}
                      />
                    </div>
                  </div>
                </nav>
              </header>
            )}

            <Routes>
              <Route path="/" element={wallet && <MainContent wallet={wallet} isEmbedded={isEmbedded} />} />
              <Route path="/demos" element={<Demos />} />
              <Route path="/debug" element={wallet && <Debug />} />
            </Routes>
          </div>
        </BrowserRouter>
      </B3Provider>
    </QueryClientProvider>
  );
}

export default App;
