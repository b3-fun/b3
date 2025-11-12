import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";
import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { ConnectionOptions } from "@thirdweb-dev/wagmi-adapter";
import { getConnectors } from "@wagmi/core";
import { useCallback, useContext, useEffect, useRef } from "react";
import {
  useActiveWallet,
  useAutoConnect,
  useConnectedWallets,
  useDisconnect,
  useSetActiveWallet,
} from "thirdweb/react";
import { Wallet, ecosystemWallet } from "thirdweb/wallets";
import { preAuthenticate } from "thirdweb/wallets/in-app";
import { useAccount, useConnect, useSwitchAccount } from "wagmi";
import { LocalSDKContext } from "../components/B3Provider/LocalSDKProvider";
import { createWagmiConfig } from "../utils/createWagmiConfig";
import { useTWAuth } from "./useTWAuth";
import { useUserQuery } from "./useUserQuery";

const debug = debugB3React("useAuthentication");

export function useAuthentication(partnerId: string) {
  const { onConnectCallback } = useContext(LocalSDKContext);
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
  const hasStartedConnecting = useAuthStore(state => state.hasStartedConnecting);
  const { authenticate } = useTWAuth();
  const { user, setUser } = useUserQuery();
  const useAutoConnectLoadingPrevious = useRef(false);
  const wagmiConfig = createWagmiConfig({ partnerId });
  const { connect } = useConnect();
  const activeWagmiAccount = useAccount();
  const { switchAccount } = useSwitchAccount();
  debug("@@activeWagmiAccount", activeWagmiAccount);

  // Check localStorage version and clear if not found or mismatched
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const version = localStorage.getItem("version");
      if (version !== "1") {
        debug("@@localStorage:clearing due to version mismatch", { version });
        localStorage.clear();
        localStorage.setItem("version", "1");
      }
    }
  }, []);

  const wallet = ecosystemWallet(ecosystemWalletId, {
    partnerId: partnerId,
  });

  const syncWagmi = useCallback(async () => {
    function syncWagmiFunc() {
      const connectors = getConnectors(wagmiConfig);
      debug("@@syncWagmi", {
        connectors,
        wallets,
      });

      // For each that matchs a TW wallet on wallets, connect to the wagmi connector
      // or, since ecosystem wallets is separate, connect those via in-app-wallet from wagmi
      connectors.forEach(async connector => {
        const twWallet = wallets.find(wallet => wallet.id === connector.id || connector.id === "in-app-wallet");

        // If no TW wallet, do not prompt the user to connect
        if (!twWallet) {
          return;
        }

        // Metamask will prompt to connect, we can just switch accounts here.
        if (connector.id === "io.metamask") {
          return switchAccount({ connector });
        }

        if (
          // If it's not an in-app wallet or it is the ecosystem wallet, connect
          connector.id !== "in-app-wallet" ||
          (connector.id === "in-app-wallet" && twWallet.id === ecosystemWalletId)
        ) {
          try {
            const options = {
              wallet: twWallet, // the connected wallet
            } satisfies ConnectionOptions;
            debug("@@syncWagmi:connecting", { twWallet, connector });
            connect({
              connector,
              ...options,
            });
          } catch (error) {
            console.error("@@syncWagmi:error", error);
          }
        } else {
          debug("@@syncWagmi:not-connecting", connector);
        }
      });
    }
    syncWagmiFunc();
    // wagmi config shouldn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, wallets]);

  useEffect(() => {
    syncWagmi();
  }, [wallets, syncWagmi]);

  const authenticateUser = useCallback(
    async (wallet?: Wallet) => {
      setHasStartedConnecting(true);

      if (!wallet) {
        throw new Error("No wallet found during auto-connect");
      }

      const account = wallet ? wallet.getAccount() : activeWallet?.getAccount();
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

        return userAuth;
      } catch (error) {
        // If re-authentication fails, try fresh authentication
        debug("Re-authentication failed, attempting fresh authentication");
        const userAuth = await authenticate(wallet, partnerId);
        setUser(userAuth.user);
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        debug("Fresh authentication successful", { userAuth });

        // Authenticate on BSMNT with B3 JWT
        const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
        debug("@@b3Jwt", b3Jwt);

        return userAuth;
      }
    },
    [activeWallet, partnerId, authenticate, setIsAuthenticated, setIsAuthenticating, setUser, setHasStartedConnecting],
  );

  const onConnect = useCallback(
    async (_walleAutoConnectedWith: Wallet, allConnectedWallets: Wallet[]) => {
      debug("@@useAuthentication:onConnect", { _walleAutoConnectedWith, allConnectedWallets });

      const wallet = allConnectedWallets.find(wallet => wallet.id.startsWith("ecosystem."));

      if (!wallet) {
        throw new Error("No smart wallet found during auto-connect");
      }

      debug("@@useAuthentication:onConnect", { wallet });

      try {
        setHasStartedConnecting(true);
        setIsConnected(true);
        setIsAuthenticating(true);
        await setActiveWallet(wallet);
        const userAuth = await authenticateUser(wallet);

        if (userAuth && onConnectCallback) {
          await onConnectCallback(wallet, userAuth.accessToken);
        }
      } catch (error) {
        debug("@@useAuthentication:onConnect:failed", { error });
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
    },
    [
      onConnectCallback,
      authenticateUser,
      isAuthenticated,
      isAuthenticating,
      isConnected,
      setActiveWallet,
      setHasStartedConnecting,
      setIsAuthenticated,
      setIsAuthenticating,
      setIsConnected,
      setUser,
    ],
  );

  const logout = useCallback(
    async (callback?: () => void) => {
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
        localStorage.removeItem("b3-user");
      }

      app.logout();
      debug("@@logout:loggedOut");

      setIsAuthenticated(false);
      setIsConnected(false);
      setUser();
      callback?.();
    },
    [activeWallet, disconnect, wallets, setIsAuthenticated, setUser, setIsConnected],
  );

  const { isLoading: useAutoConnectLoading } = useAutoConnect({
    client,
    wallets: [wallet],
    onConnect,
  });

  /**
   * useAutoConnectLoading starts as false
   */
  useEffect(() => {
    if (!useAutoConnectLoading && useAutoConnectLoadingPrevious.current && !hasStartedConnecting) {
      setIsAuthenticating(false);
    }
    useAutoConnectLoadingPrevious.current = useAutoConnectLoading;
  }, [useAutoConnectLoading, hasStartedConnecting, setIsAuthenticating]);

  const isReady = isAuthenticated && !isAuthenticating;

  return {
    logout,
    isAuthenticated,
    isReady,
    isConnecting,
    isConnected,
    wallet,
    preAuthenticate,
    connect: onConnect,
    isAuthenticating,
    onConnect,
    user,
    refetchUser: authenticateUser,
    setUser,
  };
}
