import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";
import { useAuthStore, useSiwe } from "@b3dotfun/sdk/global-account/react";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { b3MainnetThirdWeb } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import { useActiveWallet, useConnectedWallets, useDisconnect, useSetActiveWallet } from "thirdweb/react";
import { ecosystemWallet, Wallet } from "thirdweb/wallets";
import { preAuthenticate } from "thirdweb/wallets/in-app";
import { useConnect } from "./useConnect";
import { useUserQuery } from "./useUserQuery";

const debug = debugB3React("useAuthentication");

export function useAuthentication(partnerId: string) {
  const { disconnect } = useDisconnect();
  const wallets = useConnectedWallets();
  const activeWallet = useActiveWallet();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const setIsConnected = useAuthStore(state => state.setIsConnected);
  const isConnecting = useAuthStore(state => state.isConnecting);
  const isConnected = useAuthStore(state => state.isConnected);
  const isAuthenticating = useAuthStore(state => state.isAuthenticating);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setHasStartedConnecting = useAuthStore(state => state.setHasStartedConnecting);
  const setActiveWallet = useSetActiveWallet();
  const { authenticate } = useSiwe();
  const { user, setUser } = useUserQuery();

  const { connect } = useConnect(partnerId, b3MainnetThirdWeb);

  const wallet = ecosystemWallet(ecosystemWalletId, {
    partnerId: partnerId,
  });

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
        debug("@@b3Jwt", b3Jwt);
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
        debug("@@b3Jwt", b3Jwt);
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

    debug({
      isAuthenticated,
      isAuthenticating,
      isConnected,
    });
  }, []);

  const logout = async (callback?: () => void) => {
    if (activeWallet) {
      debug("@@logout:activeWallet", activeWallet);
      disconnect(activeWallet);
      debug("@@logout:activeWallet", activeWallet);
    }

    // Log out of each wallet
    wallets.forEach(wallet => {
      console.log("@@logging out", wallet);
      disconnect(wallet);
    });

    // Delete localStorage thirdweb:connected-wallet-ids
    // https://npc-labs.slack.com/archives/C070E6HNG85/p1750185115273099
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("thirdweb:connected-wallet-ids");
      localStorage.removeItem("wagmi.store");
      localStorage.removeItem("lastAuthProvider");
    }

    app.logout();
    debug("@@logout:loggedOut");

    setIsAuthenticated(false);
    setIsConnected(false);
    setUser();
    callback?.();
  };

  const isReady = isAuthenticated && !isAuthenticating;

  return {
    logout,
    isAuthenticated,
    isReady,
    isConnecting,
    isConnected,
    wallet,
    preAuthenticate,
    connect,
    isAuthenticating,
    onConnect,
    user,
    refetchUser: authenticateUser,
    setUser,
  };
}
