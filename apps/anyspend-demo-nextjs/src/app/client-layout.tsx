"use client";

import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import { B3DynamicModal, B3Provider, StyleRoot } from "@b3dotfun/sdk/global-account/react";
import "@b3dotfun/sdk/index.css";
import { QueryClient } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <B3Provider isMainnetAnySpend={true} environment="production" theme="light" automaticallySetFirstEoa={true}>
      <B3DynamicModal />
      <AnyspendProvider>
        <StyleRoot>
          <main className="min-h-screen bg-gray-50">{children}</main>
        </StyleRoot>
      </AnyspendProvider>
    </B3Provider>
  );
}
