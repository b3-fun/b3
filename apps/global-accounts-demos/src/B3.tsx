import { SignInWithB3 } from "@b3dotfun/sdk/global-account/react";
import { Account } from "thirdweb/wallets";
import { b3Chain } from "./b3Chain";

export function B3({
  closeAfterLogin,
  onLoginSuccess,
  sessionKeyAddress,
  onSessionKeySuccess
}: {
  closeAfterLogin?: boolean;
  onSessionKeySuccess?: () => void;
  sessionKeyAddress: `0x${string}`;
  onLoginSuccess?: (account: Account) => void;
}) {
  return (
    <>
      <SignInWithB3
        provider={{
          strategy: "google"
        }}
        chain={b3Chain}
        partnerId={String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
        sessionKeyAddress={sessionKeyAddress}
        onLoginSuccess={(token: any) => {
          console.log("success", token);
          onLoginSuccess?.(token);
        }}
        onSessionKeySuccess={onSessionKeySuccess}
        closeAfterLogin={closeAfterLogin}
        loginWithSiwe
      />
    </>
  );
}
