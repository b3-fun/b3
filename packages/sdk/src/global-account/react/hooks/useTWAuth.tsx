/**
 * @deprecated This hook is deprecated. Use useAuth() instead.
 * This file is kept for backward compatibility but should not be used in new code.
 */
import app from "@b3dotfun/sdk/global-account/app";
import debug from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import { Wallet } from "thirdweb/wallets";
import { useSearchParam } from "./useSearchParamsSSR";

/**
 * @deprecated Use useAuth() instead
 */
export function useTWAuth() {
  console.warn("useTWAuth is deprecated. Please migrate to useAuth() for authentication.");
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
