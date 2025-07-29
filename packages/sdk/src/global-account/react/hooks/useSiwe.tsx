import app from "@b3dotfun/sdk/global-account/app";
import debug from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import { Account } from "thirdweb/wallets";

export function useSiwe() {
    async (account: Account, partnerId: string) => {

    // generate challenge
    const challenge = await app.service("global-accounts-challenge").create({
      address: account.address,
    });
    debug("@@useAuthenticate:challenge", challenge);

    // sign challenge
    const signature = await account.signMessage({
      message: challenge.message,
    });

    debug("@@useAuthenticate:signature", signature);

    // authenticate
    const response = await app.authenticate({
      strategy: "smart-account-siwe",
      message: challenge.message,
      signature,
      serverSignature: challenge.serverSignature,
      nonce: challenge.nonce,
    });
    debug("@@useAuthenticate:response", response);

    return response;
  }, []);

  return {
    authenticate,
  };
}
