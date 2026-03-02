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

export function useAuthentication(partnerId: string, { skipAutoConnect = false }: { skipAutoConnect?: boolean } = {}) {
  const { onConnectCallback, onLogoutCallback } = useContext(LocalSDKContext);
  const { disconnect } = useDisconnect();
  const wallets = useConnectedWallets();
  // Keep refs so logout() always disconnects current wallets, not stale closure values.
  // autoConnectCore captures onConnect (and thus logout) from the first render before wallets
  // are populated — without these refs, logout() would capture wallets=[] and disconnect nothing.
  const walletsRef = useRef(wallets);
  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);
  const activeWallet = useActiveWallet();
  // Track the active wallet by ref so logout() can disconnect the exact reference
  // stored in thirdweb's activeWalletStore. walletsRef.current (from useConnectedWallets)
  // may hold a different object reference than what thirdweb considers "active",
  // causing the identity check in onWalletDisconnect to fail silently.
  const activeWalletRef = useRef(activeWallet);
  useEffect(() => {
    activeWalletRef.current = activeWallet;
  }, [activeWallet]);
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

  const logout = useCallback(
    async (callback?: () => void) => {
      // Only disconnect ecosystem/smart wallets, preserve EOA wallets (e.g. MetaMask)
      // so they remain available after re-login.
      // Use walletsRef.current (not the stale closure value) so we always get current wallets —
      // autoConnectCore captures logout from the first render when wallets is still [].
      walletsRef.current.forEach(wallet => {
        debug("@@logout:wallet", wallet.id);
        if (wallet.id.startsWith("ecosystem.") || wallet.id === "smart") {
          disconnect(wallet);
        }
      });

      // Also disconnect the active wallet using the exact reference from thirdweb's
      // activeWalletStore. The wallets in walletsRef (from useConnectedWallets) may be
      // different object references than what thirdweb holds as "active". Thirdweb's
      // onWalletDisconnect uses strict identity (===) to decide whether to clear
      // activeAccountStore — if the reference doesn't match, activeAccount stays set
      // and ConnectEmbed renders show=false (blank).
      if (activeWalletRef.current) {
        debug("@@logout:disconnecting active wallet", activeWalletRef.current.id);
        disconnect(activeWalletRef.current);
      }

      // Clear user-specific storage but preserve wallet connection state
      // so EOA wallets (e.g. MetaMask) can auto-reconnect on next login
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("lastAuthProvider");
        localStorage.removeItem("b3-user");
      }

      app.logout();
      debug("@@logout:loggedOut");

      setIsAuthenticated(false);
      setIsConnected(false);
      // Reset isAuthenticating so any in-flight page-load auto-connect that set it true
      // does not keep the login modal spinner stuck after logout() is called.
      setIsAuthenticating(false);
      setUser();
      callback?.();

      if (onLogoutCallback) {
        await onLogoutCallback();
      }
    },
    // wallets intentionally omitted — we use walletsRef.current so this callback stays stable
    // and always operates on current wallets even when captured in stale closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disconnect, setIsAuthenticated, setIsAuthenticating, setUser, setIsConnected, onLogoutCallback],
  );

  const onConnect = useCallback(
    async (_walleAutoConnectedWith: Wallet, allConnectedWallets: Wallet[]) => {
      debug("@@useAuthentication:onConnect", { _walleAutoConnectedWith, allConnectedWallets });
      try {
        const wallet = allConnectedWallets.find(wallet => wallet.id.startsWith("ecosystem."));

        if (!wallet) {
          throw new Error("No smart wallet found during auto-connect");
        }

        debug("@@useAuthentication:onConnect", { wallet });
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
        await logout();
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
      isAuthenticated,
      isAuthenticating,
      isConnected,
      setHasStartedConnecting,
      setIsConnected,
      setIsAuthenticating,
      setActiveWallet,
      authenticateUser,
      onConnectCallback,
      setIsAuthenticated,
      setUser,
      logout,
    ],
  );

  const { isLoading: useAutoConnectLoading } = useAutoConnect({
    client,
    // When skipAutoConnect is true (e.g. LoginStepContent, SignInWithB3Flow), pass an empty
    // wallets array so useAutoConnect completes immediately without firing onConnect.
    // Only AuthenticationProvider (the primary instance) should own auto-connect.
    wallets: skipAutoConnect ? [] : [wallet],
    onConnect,
    onTimeout: () => {
      if (skipAutoConnect) return;
      logout().catch(error => {
        debug("@@useAuthentication:logout on timeout failed", { error });
      });
    },
  });

  /**
   * useAutoConnectLoading starts as false.
   * Only the primary (non-skip) instance manages isAuthenticating via this effect
   * to avoid race conditions when multiple useAuthentication instances are mounted.
   */
  useEffect(() => {
    if (skipAutoConnect) return;
    if (!useAutoConnectLoading && useAutoConnectLoadingPrevious.current && !hasStartedConnecting) {
      setIsAuthenticating(false);
    }
    useAutoConnectLoadingPrevious.current = useAutoConnectLoading;
  }, [useAutoConnectLoading, hasStartedConnecting, setIsAuthenticating, skipAutoConnect]);

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
