import app from "@b3dotfun/sdk/global-account/app";
import debug from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import { Wallet } from "thirdweb/wallets";
import { useSearchParam } from "./useSearchParamsSSR";

export function useTWAuth() {
  const referralCode = useSearchParam("referralCode");

  const authenticate = useCallback(
    async (wallet: Wallet, partnerId: string) => {
      if (!wallet || !wallet?.getAuthToken?.()) throw new Error("Wallet not found");

      const authToken = wallet.getAuthToken();
      debug("@@useTWSignIn:authToken", authToken);
      debug("@@useTWSignIn:referralCode", referralCode);

      // authenticate
      const response = await app.authenticate({
        strategy: "thirdweb-jwt",
        accessToken: authToken,
        // http://localhost:5173/?referralCode=GIO2
        referralCode,
        partnerId: partnerId,
      });
      debug("@@useTWSignIn:response", response);

      return response;
    },
    [referralCode],
  );

  return {
    authenticate,
  };
}
