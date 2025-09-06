import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";
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

export function useAuthentication(partnerId: string, loginWithSiwe?: boolean) {
  const { disconnect } = useDisconnect();
  const wallets = useConnectedWallets();
  const activeWallet = useActiveWallet();
  const { authenticate } = useSiwe();
  const { setUser } = useB3();
  const isAuthenticating = useAuthStore(state => state.isAuthenticating);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setIsConnecting = useAuthStore(state => state.setIsConnecting);
  const setIsConnected = useAuthStore(state => state.setIsConnected);
  const isConnecting = useAuthStore(state => state.isConnecting);
  const isConnected = useAuthStore(state => state.isConnected);
  const useAutoConnectLoadingPrevious = useRef(false);
  const setIsAuthenticatingV2 = useAuthStore(state => state.setIsAuthenticatingV2);
  const isAuthenticatingV2 = useAuthStore(state => state.isAuthenticatingV2);
  const hasStartedConnecting = useAuthStore(state => state.hasStartedConnecting);
  const setHasStartedConnecting = useAuthStore(state => state.setHasStartedConnecting);
  const { connect } = useConnect(partnerId, b3MainnetThirdWeb);

  const wallet = ecosystemWallet(ecosystemWalletId, {
    partnerId: partnerId,
  });

  const { isLoading: useAutoConnectLoading } = useAutoConnect({
    client,
    wallets: [wallet],
    onConnect: async wallet => {
      setHasStartedConnecting(true);

      try {
        setIsConnected(true);
        if (!loginWithSiwe) {
          debug("Skipping SIWE login", { loginWithSiwe });
          setIsAuthenticated(true);

          setIsAuthenticatingV2(false);
          return;
        }
        debug("setIsAuthenticating:true:4");
        setIsAuthenticating(true);
        const account = await wallet.getAccount();
        if (!account) {
          throw new Error("No account found during auto-connect");
        }

        // Try to re-authenticate first
        try {
          const userAuth = await app().reAuthenticate();
          setUser(userAuth.user);
          setIsAuthenticated(true);
          setIsAuthenticatingV2(false);
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
          setIsAuthenticatingV2(false);
          debug("Fresh authentication successful", { userAuth });

          // Authenticate on BSMNT with B3 JWT
          const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
          console.log("@@b3Jwt", b3Jwt);
        }
      } catch (error) {
        debug("Auto-connect authentication failed", { error });
        setIsAuthenticated(false);
        debug("setIsAuthenticating:false:4");
        setUser();
      }
      setIsAuthenticatingV2(false);
    },
  });

  /**
   * useAutoConnectLoading starts as false
   */
  useEffect(() => {
    if (!useAutoConnectLoading && useAutoConnectLoadingPrevious.current && !hasStartedConnecting) {
      setIsAuthenticatingV2(false);
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
        setIsAuthenticating(false);
        setIsConnecting(false);
      }, 100); // Add a small delay to prevent quick flickers
      return () => clearTimeout(timeout);
    } else {
      debug("setIsAuthenticating:false:5b");
      setIsAuthenticating(false);
      setIsConnecting(false);
    }
  }, [useAutoConnectLoading, isAuthenticated, setIsAuthenticating, setIsConnecting, setIsConnected]);

  const logout = async (callback?: () => void) => {
    if (activeWallet) {
      debug("@@logout:activeWallet", activeWallet);
      disconnect(activeWallet);
      debug("@@logout:disconnected");
      console.log("@@gio:logout:activeWallet", activeWallet);
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

    app().logout();
    debug("@@logout:loggedOut");

    setIsAuthenticated(false);
    setIsConnected(false);
    setUser();
    callback?.();
  };

  const isReady = isAuthenticated && !useAutoConnectLoading && !isAuthenticating;

  return {
    logout,
    isAuthenticating: useAutoConnectLoading || isAuthenticating,
    isAuthenticated,
    isReady,
    isConnecting,
    isConnected,
    wallet,
    preAuthenticate,
    connect,
    isAuthenticatingV2,
  };
}
