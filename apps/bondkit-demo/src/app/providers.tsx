"use client";

import { B3DynamicModal, B3Provider, StyleRoot } from "@b3dotfun/sdk/global-account/react";

// Custom RPC URLs configuration
const rpcUrls = {
  8453: "https://base-rpc.publicnode.com", // Base mainnet
  // Add other chain RPC URLs as needed
  // 1: "https://your-ethereum-rpc-url", // Ethereum mainnet
  // 10: "https://your-optimism-rpc-url", // Optimism
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <B3Provider environment="production" theme="light" automaticallySetFirstEoa={true} rpcUrls={rpcUrls}>
      <B3DynamicModal />
      <StyleRoot>{children}</StyleRoot>
    </B3Provider>
  );
}
