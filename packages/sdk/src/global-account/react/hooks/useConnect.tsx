import { ecosystemWalletId, THIRDWEB_CLIENT_ID } from "@b3dotfun/sdk/shared/constants";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useCallback, useState } from "react";
import { Chain } from "thirdweb";
import { useConnect as useConnectTW } from "thirdweb/react";
import { ecosystemWallet, SingleStepAuthArgsType } from "thirdweb/wallets";
import { useB3 } from "../components/B3Provider/useB3";
const debug = debugB3React("useConnect");

/**
 * This hook is used to connect to a wallet using the thirdweb client.
 */
export function useConnect(chain?: Chain) {
  if (!chain) {
    throw new Error("Chain is required");
  }

  const { partnerId } = useB3();
  const { connect } = useConnectTW();
  const [isLoading, setIsLoading] = useState(false);

  if (!partnerId) {
    throw new Error("partnerId is required in B3Provider");
  }

  /**
   * This is a wrapper around the thirdweb connect function.
   * It is used to connect to a wallet using the thirdweb client.
   */
  const connectTw = useCallback(
    async (strategyOptions?: SingleStepAuthArgsType) => {
      setIsLoading(true);
      return await connect(async () => {
        if (!strategyOptions) throw new Error("Strategy options are required");

        debug("@@useConnect:strategyOptions", {
          partnerId,
          strategyOptions,
          clientId: THIRDWEB_CLIENT_ID,
        });

        // Create a wallet for "Allowlist" ecosystems restricted to partners
        const wallet = ecosystemWallet(ecosystemWalletId, {
          partnerId: partnerId,
        });

        const connect = await wallet.connect({
          client,
          chain,
          // This is the payload that is sent to the auth endpoint
          ...strategyOptions,
        });

        debug("@@useConnect:connect:", connect);
        setIsLoading(false);

        if (!wallet) throw new Error("Failed to connect");
        return wallet;
      });
    },
    [chain, connect, partnerId],
  );

  return { connect: connectTw, isLoading };
}
