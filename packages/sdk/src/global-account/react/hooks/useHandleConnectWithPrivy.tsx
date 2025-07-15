import { useConnect } from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useIdentityToken, usePrivy } from "@privy-io/react-auth";
import { useCallback, useRef, useState } from "react";
import { Chain } from "thirdweb";
import { Account } from "thirdweb/wallets";

const debug = debugB3React("@@b3:useHandleConnectWithPrivy");

/**
 * This essentially wraps our useConnect hook to handle the Privy auth flow.
 * Currently, this is for the basement-privy strategy
 */
export function useHandleConnectWithPrivy(partnerId: string, chain?: Chain, onSuccess?: (account: Account) => void) {
  if (!chain) {
    throw new Error("Chain is required");
  }

  const { connect } = useConnect(partnerId, chain);
  const [isLoading, setIsLoading] = useState(true);
  const isConnecting = useRef(false);
  const { identityToken } = useIdentityToken();
  const { getAccessToken } = usePrivy();
  const [fullToken, setFullToken] = useState<string | null>(null);

  const connectTw = useCallback(async () => {
    if (isConnecting.current) {
      debug("@@connectTw:skipping:isConnecting", isConnecting.current);
      return;
    }
    setIsLoading(true);
    isConnecting.current = true;

    // Form token
    const accessToken = await getAccessToken();
    const fullToken = `${accessToken}+${identityToken}`;
    setFullToken(fullToken);
    debug("@@connectTw:fullToken", fullToken);
    if (!fullToken) throw new Error("Token is not set");

    // Connect to TW via privy
    const wallet = await connect({
      strategy: "auth_endpoint",
      payload: JSON.stringify({
        strategy: "basement",
        accessToken: fullToken,
      }),
    });

    debug("@@useHandleConnectWithPrivy:connect:return", wallet);
    setIsLoading(false);

    // Handle onsuccess & more
    try {
      debug("@@autoLogin:starting", fullToken);

      const account = wallet?.getAccount();

      if (!account) {
        throw new Error("Failed to connect");
      }

      onSuccess?.(account);

      if (!account) {
        throw new Error("Failed to connect");
      }
    } catch (error) {
      console.error("@@Error signing in with Privy", error);
    } finally {
      isConnecting.current = false;
      setIsLoading(false);
    }

    return wallet;
  }, [connect, getAccessToken, identityToken, onSuccess]);

  return { connectTw, isLoading, fullToken };
}
