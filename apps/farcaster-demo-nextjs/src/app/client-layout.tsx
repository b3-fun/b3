"use client";

import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import { B3DynamicModal, B3Provider, StyleRoot } from "@b3dotfun/sdk/global-account/react";
import sdk from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { EIP1193 } from "thirdweb/wallets";

import "@b3dotfun/sdk/index.css";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <B3ProviderWrapper>
      <AnyspendProvider featureFlags={{ showPoints: true }}>
        <B3DynamicModal />
        <StyleRoot>
          <main className="b3-root min-h-screen">{children}</main>
        </StyleRoot>
      </AnyspendProvider>
    </B3ProviderWrapper>
  );
}

function B3ProviderWrapper({ children }: { children: React.ReactNode }) {
  const farcasterProvider = useFarcasterProvider();

  return (
    <B3Provider
      environment="production"
      theme="light"
      automaticallySetFirstEoa={true}
      defaultEoaProvider={farcasterProvider}
      partnerId={String(process.env.NEXT_PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
      stripePublishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      simDuneApiKey={process.env.NEXT_PUBLIC_SIM_DUNE_API_KEY}
    >
      {children}
    </B3Provider>
  );
}

function useFarcasterProvider() {
  const [provider, setProvider] = useState<EIP1193.EIP1193Provider>();

  useEffect(() => {
    sdk
      .isInMiniApp()
      .then(isInMiniApp => {
        if (isInMiniApp) {
          setProvider(sdk.wallet.ethProvider as EIP1193.EIP1193Provider);
        }
      })
      .catch(() => {})
      .finally(() => {
        sdk.actions.ready();
      });
  }, []);

  return provider;
}
