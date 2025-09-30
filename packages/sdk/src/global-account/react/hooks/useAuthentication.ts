import app from "@b3dotfun/sdk/global-account/app";
import { useAuthStore, useB3 } from "@b3dotfun/sdk/global-account/react";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { b3MainnetThirdWeb } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useEffect, useRef } from "react";
import { useActiveWallet, useAutoConnect, useConnectedWallets, useDisconnect } from "thirdweb/react";
import { ecosystemWallet } from "thirdweb/wallets";
import { preAuthenticate } from "thirdweb/wallets/in-app";
import { useConnect } from "./useConnect";
import { useSiwe } from "./useSiwe";

const debug = debugB3React("useAuthentication");

export function useAuthentication(loginWithSiwe?: boolean) {
  const { partnerId } = useB3();
  const { disconnect } = useDisconnect();
  const wallets = useConnectedWallets();
  const activeWallet = useActiveWallet();
  const { authenticate } = useSiwe();
  const { setUser } = useB3();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const setIsConnecting = useAuthStore(state => state.setIsConnecting);
  const setIsConnected = useAuthStore(state => state.setIsConnected);
  const isConnecting = useAuthStore(state => state.isConnecting);
  const isConnected = useAuthStore(state => state.isConnected);
  const useAutoConnectLoadingPrevious = useRef(false);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const isAuthenticating = useAuthStore(state => state.isAuthenticating);
  const hasStartedConnecting = useAuthStore(state => state.hasStartedConnecting);
  const setHasStartedConnecting = useAuthStore(state => state.setHasStartedConnecting);
  const { connect } = useConnect(b3MainnetThirdWeb);

  const wallet = ecosystemWallet(ecosystemWalletId, {
    partnerId: partnerId,
  });

  const { isLoading: useAutoConnectLoading } = useAutoConnect({
    client,
    wallets: [wallet],
  });

  /**
   * useAutoConnectLoading starts as false
   */
  useEffect(() => {
    if (!useAutoConnectLoading && useAutoConnectLoadingPrevious.current && !hasStartedConnecting) {
      setIsAuthenticating(false);
    }
    useAutoConnectLoadingPrevious.current = useAutoConnectLoading;
  }, [useAutoConnectLoading]);

  // Ensure isAuthenticating stays true until we're fully ready
  useEffect(() => {
    if (useAutoConnectLoading) {
      setIsConnecting(true);
    } else if (!isAuthenticated) {
      // Only set isAuthenticating to false if we're not authenticated
      // This prevents the flicker state where both isAuthenticating and isAuthenticated are false
      const timeout = setTimeout(() => {
        debug("setIsAuthenticating:false:5a");
        setIsConnecting(false);
      }, 100); // Add a small delay to prevent quick flickers
      return () => clearTimeout(timeout);
    } else {
      debug("setIsAuthenticating:false:5b");
      setIsConnecting(false);
    }
  }, [useAutoConnectLoading, isAuthenticated, setIsConnecting, setIsConnected]);

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

  const isReady = isAuthenticated && !useAutoConnectLoading && !isAuthenticating;

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
  };
}
