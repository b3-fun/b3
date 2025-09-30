import app from "@b3dotfun/sdk/global-account/app";
import { useAuthStore, useB3 } from "@b3dotfun/sdk/global-account/react";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { b3MainnetThirdWeb } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useRef } from "react";
import { useActiveWallet, useConnectedWallets, useDisconnect } from "thirdweb/react";
import { ecosystemWallet } from "thirdweb/wallets";
import { preAuthenticate } from "thirdweb/wallets/in-app";
import { useConnect } from "./useConnect";
import { useSiwe } from "./useSiwe";

const debug = debugB3React("useAuthentication");

export function useAuthentication() {
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
  };
}
