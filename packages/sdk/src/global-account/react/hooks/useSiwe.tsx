import app from "@b3dotfun/sdk/global-account/app.rest";
import debug from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import { Account } from "thirdweb/wallets";
import { useSearchParam } from "./useSearchParamsSSR";

export function useSiwe() {
  const referralCode = useSearchParam("referralCode");

  const authenticate = useCallback(
    async (account: Account, partnerId: string) => {
      if (!account || !account.signMessage) throw new Error("Account not found");

      console.log("@@useAuthenticate:referralCode", referralCode);
      // generate challenge
      const challenge = await app("rest").service("global-accounts-challenge").create({
        address: account.address,
      });
      debug("@@useAuthenticate:challenge", challenge);

      // sign challenge
      const signature = await account.signMessage({
        message: challenge.message,
      });

      debug("@@useAuthenticate:signature", signature);

      // authenticate
      const response = await app("rest").authenticate({
        strategy: "smart-account-siwe",
        message: challenge.message,
        signature,
        serverSignature: challenge.serverSignature,
        nonce: challenge.nonce,
        // http://localhost:5173/?referralCode=GIO2
        referralCode,
        partnerId: partnerId,
      });
      debug("@@useAuthenticate:response", response);

      return response;
    },
    [referralCode],
  );

  return {
    authenticate,
  };
}
