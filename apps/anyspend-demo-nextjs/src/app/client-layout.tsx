"use client";

import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import { B3DynamicModal, B3Provider, StyleRoot } from "@b3dotfun/sdk/global-account/react";

import "@b3dotfun/sdk/index.css";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <B3Provider environment="production" theme="light" automaticallySetFirstEoa={true}>
      <AnyspendProvider>
        <B3DynamicModal />
        <StyleRoot>
          <main className="min-h-screen bg-gray-50">{children}</main>
        </StyleRoot>
      </AnyspendProvider>
    </B3Provider>
  );
}
