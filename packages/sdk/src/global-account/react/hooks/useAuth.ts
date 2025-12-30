import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";
import { useAuthStore, useB3 } from "@b3dotfun/sdk/global-account/react";
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
import { useSearchParam } from "./useSearchParamsSSR";
import { useUserQuery } from "./useUserQuery";

const debug = debugB3React("useAuth");

/**
 * Unified authentication hook that uses Turnkey for authentication
 * This replaces the previous Thirdweb-based authentication
 *
 * This hook provides 1:1 feature parity with useAuthentication.ts
 */
export function useAuth() {
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
  const useAutoConnectLoadingPrevious = useRef(false);
  const referralCode = useSearchParam("referralCode");
  const { partnerId } = useB3();
  const wagmiConfig = createWagmiConfig({ partnerId });
  const { connect } = useConnect();
  const activeWagmiAccount = useAccount();
  const { switchAccount } = useSwitchAccount();
  const { user, setUser } = useUserQuery();
  debug("@@activeWagmiAccount", activeWagmiAccount);

  const wallet = ecosystemWallet(ecosystemWalletId, {
    partnerId: partnerId,
  });

  /**
   * Re-authenticate using existing session
   * Also updates user state and authenticates with BSMNT
   */
  const reAuthenticate = useCallback(async () => {
    debug("Re-authenticating...");
    try {
      const response = await app.reAuthenticate();
      debug("Re-authentication successful", response);

      // Update user state if user data exists
      if (response.user) {
        setUser(response.user);
        debug("User state updated", response.user);
      }

      // Authenticate with BSMNT
      try {
        const b3Jwt = await authenticateWithB3JWT(response.accessToken);
        debug("BSMNT re-authentication successful", b3Jwt);
      } catch (bsmntError) {
        // BSMNT authentication failure shouldn't block the main auth flow
        debug("BSMNT re-authentication failed (non-critical)", bsmntError);
      }

      return response;
    } catch (err: any) {
      debug("Re-authentication failed", err);
      throw err;
    }
  }, [setUser]);

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

  /**
   * Authenticate user using Turnkey
   * Note: This no longer requires a wallet for authentication.
   * Wallets are still used for signing transactions, but authentication is done via Turnkey email OTP.
   *
   * For backward compatibility, this function still accepts a wallet parameter,
   * but it's not used for authentication anymore.
   */
  const authenticateUser = useCallback(async () => {
    setHasStartedConnecting(true);

    // Try to re-authenticate first
    try {
      const userAuth = await reAuthenticate();
      setUser(userAuth.user);
      setIsAuthenticated(true);
      setIsAuthenticating(false);
      debug("Re-authenticated successfully", { userAuth });

      // Authenticate on BSMNT with B3 JWT
      const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
      debug("@@b3Jwt", b3Jwt);

      return userAuth;
    } catch (error) {
      // If re-authentication fails, user needs to authenticate via Turnkey
      // This should be handled by the Turnkey auth modal/flow
      debug("Re-authentication failed. User needs to authenticate via Turnkey.", error);
      setIsAuthenticated(false);
      setIsAuthenticating(false);
      throw new Error("Authentication required. Please authenticate via Turnkey.");
    }
  }, [reAuthenticate, setIsAuthenticated, setIsAuthenticating, setUser, setHasStartedConnecting]);

  /**
   * Authenticate with Turnkey using email OTP
   * This is the primary authentication method, replacing Thirdweb wallet-based auth
   *
   * This function:
   * 1. Authenticates with FeathersJS (persists session via cookies)
   * 2. Sets user state in the user store (persists to localStorage)
   * 3. Authenticates with BSMNT for basement integration
   */
  const authenticate = useCallback(
    async (turnkeySessionJwt: string, partnerId: string) => {
      if (!turnkeySessionJwt) {
        throw new Error("Turnkey session JWT is required");
      }

      debug("Authenticating with Turnkey JWT", { referralCode, partnerId });

      try {
        // Step 1: Authenticate with FeathersJS (session persisted via cookies)
        const response = await app.authenticate({
          strategy: "turnkey-jwt",
          accessToken: turnkeySessionJwt,
          referralCode,
          partnerId: partnerId,
        } as any);

        debug("Authentication successful", response);

        // Step 2: Set user state (persists to localStorage via Zustand)
        if (response.user) {
          setUser(response.user);
          debug("User state updated", response.user);
        }

        // Step 3: Authenticate with BSMNT for basement integration
        try {
          const b3Jwt = await authenticateWithB3JWT(response.accessToken);
          debug("BSMNT authentication successful", b3Jwt);
        } catch (bsmntError) {
          // BSMNT authentication failure shouldn't block the main auth flow
          debug("BSMNT authentication failed (non-critical)", bsmntError);
        }

        return response;
      } catch (err: any) {
        debug("Authentication failed", err);
        throw err;
      }
    },
    [referralCode, setUser],
  );

  /**
   * Handle wallet connection
   * Note: With Turnkey migration, wallet connection is primarily for signing transactions,
   * not for authentication. Authentication should be done separately via Turnkey email OTP.
   */
  /**
   * Handle wallet connection
   * Note: With Turnkey migration, wallet connection is primarily for signing transactions,
   * not for authentication. Authentication should be done separately via Turnkey email OTP.
   */
  const onConnect = useCallback(
    async (_walleAutoConnectedWith: Wallet, allConnectedWallets: Wallet[]) => {
      debug("@@useAuth:onConnect", { _walleAutoConnectedWith, allConnectedWallets });

      const wallet = allConnectedWallets.find(wallet => wallet.id.startsWith("ecosystem."));

      if (!wallet) {
        throw new Error("No smart wallet found during auto-connect");
      }

      debug("@@useAuth:onConnect", { wallet });

      try {
        setHasStartedConnecting(true);
        setIsConnected(true);
        setIsAuthenticating(true);
        await setActiveWallet(wallet);

        // Try to authenticate user (will use re-authenticate if session exists)
        // If no session exists, authentication will need to happen via Turnkey flow
        try {
          const userAuth = await authenticateUser();

          if (userAuth && onConnectCallback) {
            await onConnectCallback(wallet, userAuth.accessToken);
          }
        } catch (authError) {
          // Authentication failed - this is expected if user hasn't authenticated via Turnkey yet
          // The Turnkey auth modal should handle this
          debug("@@useAuth:onConnect:authFailed", { authError });
          // Don't set isAuthenticated to false here - let the Turnkey flow handle it
        }
      } catch (error) {
        debug("@@useAuth:onConnect:failed", { error });
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
      setUser(undefined);
      callback?.();
    },
    [activeWallet, disconnect, wallets, setIsAuthenticated, setUser, setIsConnected],
  );

  const { isLoading: useAutoConnectLoading } = useAutoConnect({
    client,
    wallets: [wallet],
    onConnect,
    onTimeout: () => {
      logout().catch(error => {
        debug("@@useAuth:logout on timeout failed", { error });
      });
    },
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
    authenticate,
    reAuthenticate,
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
