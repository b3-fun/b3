"use client";

import { SignInWithB3 } from "@b3dotfun/sdk/global-account/react";
import { defineChain } from "thirdweb";

export default function SignInWithB3OnBase() {
  const baseChain = defineChain({
    id: 8453,
    name: "Base",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpc: "https://mainnet.base.org",
    blockExplorers: [
      {
        name: "Basescan",
        url: "https://basescan.org",
      },
    ],
  });

  return <SignInWithB3 chain={baseChain} partnerId="bondkit" />;
}
