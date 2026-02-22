"use client";

import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import { B3DynamicModal, B3Provider, StyleRoot } from "@b3dotfun/sdk/global-account/react";
import { ThemeProvider, useTheme } from "./ThemeContext";

import "@b3dotfun/sdk/index.css";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <B3ProviderWrapper>
        <AnyspendProvider featureFlags={{ showPoints: true }}>
          <B3DynamicModal />
          <StyleRoot>
            <main className="b3-root min-h-screen">{children}</main>
          </StyleRoot>
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
      partnerId={String(process.env.NEXT_PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
      stripePublishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      simDuneApiKey={process.env.NEXT_PUBLIC_SIM_DUNE_API_KEY}
    >
      {children}
    </B3Provider>
  );
}
