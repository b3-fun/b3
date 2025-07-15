import { SignInWithB3 } from "@b3dotfun/sdk/global-account/react";

import { b3Chain } from "../constants/b3Chain";
import type { Wallet } from "../utils/wallet";

export function SignIn({ wallet }: { wallet: Wallet }) {
  if (!wallet?.address) {
    return null;
  }

  return (
    <SignInWithB3
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
      loginWithSiwe
    />
  );
}
