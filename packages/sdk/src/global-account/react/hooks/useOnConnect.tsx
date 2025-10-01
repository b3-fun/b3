import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";
import { useAuthStore, useSiwe } from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import { useActiveWallet, useSetActiveWallet } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";
import { useUserQuery } from "./useUserQuery";

const debug = debugB3React("useOnConnect");

export function useOnConnect(partnerId: string) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const isAuthenticating = useAuthStore(state => state.isAuthenticating);
  const isConnected = useAuthStore(state => state.isConnected);
  const setIsConnected = useAuthStore(state => state.setIsConnected);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const setHasStartedConnecting = useAuthStore(state => state.setHasStartedConnecting);
  const setActiveWallet = useSetActiveWallet();
  const { authenticate } = useSiwe();
  const { user, setUser } = useUserQuery();
  const activeWallet = useActiveWallet();

  const authenticateUser = useCallback(
    async (wallet?: Wallet) => {
      const account = wallet ? wallet.getAccount() : activeWallet?.getAccount();
      if (!account) {
        throw new Error("No account found during auto-connect");
      }
      if (!account) {
        throw new Error("No account found during auto-connect");
      }

      // Try to re-authenticate first
      try {
        const userAuth = await app.reAuthenticate();
        setUser(userAuth.user);
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        debug("Re-authenticated successfully", { userAuth });

        // Authenticate on BSMNT with B3 JWT
        const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
        console.log("@@b3Jwt", b3Jwt);
      } catch (error) {
        // If re-authentication fails, try fresh authentication
        debug("Re-authentication failed, attempting fresh authentication");
        const userAuth = await authenticate(account, partnerId);
        setUser(userAuth.user);
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        debug("Fresh authentication successful", { userAuth });

        // Authenticate on BSMNT with B3 JWT
        const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
        console.log("@@b3Jwt", b3Jwt);
      }
    },
    [activeWallet],
  );

  const onConnect = useCallback(async (wallet: Wallet) => {
    debug("@@wagmi:onConnect", { wallet });

    try {
      setHasStartedConnecting(true);
      setIsConnected(true);
      setIsAuthenticating(true);
      await setActiveWallet(wallet);
      await authenticateUser(wallet);
    } catch (error) {
      debug("@@wagmi:onConnect:failed", { error });
      setIsAuthenticated(false);
      setUser(undefined);
    } finally {
      setIsAuthenticating(false);
    }

    console.log("@@wtf");
    debug({
      isAuthenticated,
      isAuthenticating,
      isConnected,
    });
  }, []);

  return {
    onConnect,
    user,
    setUser,
    refetchUser: authenticateUser,
  };
}
