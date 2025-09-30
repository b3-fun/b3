import { Users } from "@b3dotfun/b3-api";
import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";
import { RelayKitProviderWrapper, TooltipProvider, useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { loadGA4Script } from "@b3dotfun/sdk/global-account/utils/analytics";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import "@reservoir0x/relay-kit-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { inAppWalletConnector } from "@thirdweb-dev/wagmi-adapter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import {
  getLastAuthProvider,
  ThirdwebProvider,
  useActiveAccount,
  useConnectedWallets,
  useSetActiveWallet,
} from "thirdweb/react";
import { Account, Wallet } from "thirdweb/wallets";
import { createConfig, http, WagmiProvider } from "wagmi";
import { ClientType, setClientType } from "../../../client-manager";
import { useSiwe } from "../../hooks/useSiwe";
import { StyleRoot } from "../StyleRoot";
import { B3Context, B3ContextType } from "./types";

const debug = debugB3React("B3Provider");

/**
 * Default permissions configuration for B3 provider
 */
const DEFAULT_PERMISSIONS = {
  approvedTargets: ["0xa8e42121e318e3D3BeD7f5969AF6D360045317DD"], // Example contract
  nativeTokenLimitPerTransaction: 0.1, // in ETH
  startDate: new Date(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
};

// Create queryClient instance
const queryClient = new QueryClient();

/**
 * Main B3Provider component
 */
export function B3Provider({
  theme = "light",
  children,
  accountOverride,
  environment,
  automaticallySetFirstEoa,
  simDuneApiKey,
  toaster,
  clientType = "rest",
  rpcUrls,
  partnerId,
  loginWithSiwe,
}: {
  theme: "light" | "dark";
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  automaticallySetFirstEoa?: boolean;
  simDuneApiKey?: string;
  toaster?: {
    position?: "top-center" | "top-right" | "bottom-center" | "bottom-right";
    style?: React.CSSProperties;
  };
  clientType?: ClientType;
  rpcUrls?: Record<number, string>;
  partnerId: string;
  loginWithSiwe?: boolean;
}) {
  // Initialize Google Analytics on mount
  useEffect(() => {
    loadGA4Script();
  }, []);

  // Set the client type when provider mounts
  useEffect(() => {
    setClientType(clientType);
  }, [clientType]);

  // Store for the onConnect handler reference
  const onConnectHandlerRef = useRef<((wallet: Wallet) => Promise<void>) | null>(null);

  const ecocystemConfig = useMemo(() => {
    return {
      ecosystemId: ecosystemWalletId,
      partnerId: partnerId,
      client,
    };
  }, [partnerId]);

  /**
   * Creates wagmi config with optional custom RPC URLs and handles onConnect from wagmi adapter
   * @param rpcUrls - Optional mapping of chain IDs to RPC URLs
   */
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [supportedChains[0], ...supportedChains.slice(1)],
        transports: Object.fromEntries(supportedChains.map(chain => [chain.id, http(rpcUrls?.[chain.id])])) as any,
        connectors: [
          inAppWalletConnector({
            ...ecocystemConfig,
            client,
            onConnect: async wallet => {
              debug("@@wagmi-adapter:onConnect", wallet);
              // Call the handler set by InnerProvider
              if (onConnectHandlerRef.current) {
                await onConnectHandlerRef.current(wallet);
              }
            },
          }),
          // injected(),
          // coinbaseWallet({ appName: "HypeDuel" }),
        ],
      }),
    [ecocystemConfig, rpcUrls],
  );

  return (
    <ThirdwebProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <InnerProvider
              accountOverride={accountOverride}
              environment={environment}
              theme={theme}
              automaticallySetFirstEoa={!!automaticallySetFirstEoa}
              clientType={clientType}
              partnerId={partnerId}
              loginWithSiwe={loginWithSiwe}
              onConnectHandlerRef={onConnectHandlerRef}
            >
              <RelayKitProviderWrapper simDuneApiKey={simDuneApiKey}>
                {children}
                {/* For the modal https://github.com/b3-fun/b3/blob/main/packages/sdk/src/global-account/react/components/ui/dialog.tsx#L46 */}
                <StyleRoot id="b3-root" />
                <Toaster theme={theme} position={toaster?.position} style={toaster?.style} />
              </RelayKitProviderWrapper>
            </InnerProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThirdwebProvider>
  );
}

/**
 * Inner provider component that provides the actual B3Context
 */
export function InnerProvider({
  children,
  accountOverride,
  environment,
  defaultPermissions = DEFAULT_PERMISSIONS,
  automaticallySetFirstEoa,
  theme = "light",
  clientType = "socket",
  partnerId,
  loginWithSiwe,
  onConnectHandlerRef,
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  defaultPermissions?: PermissionsConfig;
  automaticallySetFirstEoa: boolean;
  theme: "light" | "dark";
  clientType?: ClientType;
  partnerId: string;
  loginWithSiwe?: boolean;
  onConnectHandlerRef: React.MutableRefObject<((wallet: Wallet) => Promise<void>) | null>;
}) {
  const activeAccount = useActiveAccount();
  const [manuallySelectedWallet, setManuallySelectedWallet] = useState<Wallet | undefined>(undefined);
  const wallets = useConnectedWallets();
  const setActiveWallet = useSetActiveWallet();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setIsConnected = useAuthStore(state => state.setIsConnected);
  const setHasStartedConnecting = useAuthStore(state => state.setHasStartedConnecting);
  const { authenticate } = useSiwe();
  const hasAuthenticatedRef = useRef(false);
  debug("@@wallets", wallets);

  const [user, setUser] = useState<Users | undefined>(() => {
    // Try to restore user from localStorage on initialization
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("b3-user");
        return storedUser ? JSON.parse(storedUser) : undefined;
      } catch (error) {
        console.warn("Failed to restore user from localStorage:", error);
        return undefined;
      }
    }
    return undefined;
  });

  // Use given accountOverride or activeAccount from thirdweb
  const effectiveAccount = isAuthenticated ? accountOverride || activeAccount : undefined;

  // Persist user to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("b3-user", JSON.stringify(user));
      } else {
        localStorage.removeItem("b3-user");
      }
    }
  }, [user]);

  // Consolidated onConnect handler - this is the SINGLE source of truth for auth
  const handleWalletConnect = useCallback(
    async (wallet: Wallet) => {
      // Only run if we haven't authenticated yet
      if (hasAuthenticatedRef.current || isAuthenticated) {
        debug("@@handleWalletConnect:skipping - already authenticated");
        return;
      }

      debug("@@handleWalletConnect:starting", { loginWithSiwe });
      hasAuthenticatedRef.current = true;
      setHasStartedConnecting(true);

      try {
        setIsConnected(true);
        if (!loginWithSiwe) {
          debug("Skipping SIWE login", { loginWithSiwe });
          setIsAuthenticated(true);
          setIsAuthenticating(false);
          return;
        }

        const account = await wallet.getAccount();
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
      } catch (error) {
        debug("Auto-connect authentication failed", { error });
        setIsAuthenticated(false);
        setIsAuthenticating(false);
        setUser(undefined);
        hasAuthenticatedRef.current = false;
      }
    },
    [loginWithSiwe, isAuthenticated, authenticate, partnerId, setHasStartedConnecting, setIsConnected, setIsAuthenticated, setIsAuthenticating, setUser],
  );

  // Set the onConnect handler reference so wagmi adapter can call it
  useEffect(() => {
    onConnectHandlerRef.current = handleWalletConnect;
  }, [handleWalletConnect]);

  const setWallet = useCallback(
    (wallet: Wallet) => {
      setManuallySelectedWallet(wallet);
      const account = wallet.getAccount();
      debug("@@setWallet", wallet.id, account?.address);
      setActiveWallet(wallet);
    },
    [setManuallySelectedWallet, setActiveWallet],
  );

  useEffect(() => {
    const autoSelectFirstEOAWallet = async () => {
      // Only proceed if auto-selection is enabled and user is authenticated
      if (!automaticallySetFirstEoa || !isAuthenticated) {
        return;
      }

      // Find the first EOA wallet (excluding ecosystem wallets)
      const isEOAWallet = (wallet: Wallet) => !wallet.id.startsWith("ecosystem.");
      const firstEOAWallet = wallets.find(isEOAWallet);

      if (firstEOAWallet) {
        // Only auto-select if the last auth was via wallet or no previous auth provider
        const lastAuthProvider = await getLastAuthProvider();
        const shouldAutoSelect = lastAuthProvider === null || lastAuthProvider === "wallet";

        if (shouldAutoSelect) {
          setWallet(firstEOAWallet);
        }
      }
    };

    autoSelectFirstEOAWallet();
  }, [automaticallySetFirstEoa, isAuthenticated, setWallet, wallets]);

  return (
    <B3Context.Provider
      value={{
        account: effectiveAccount,
        setWallet,
        wallet: manuallySelectedWallet,
        user,
        setUser,
        initialized: true,
        ready: !!effectiveAccount,
        automaticallySetFirstEoa,
        environment,
        defaultPermissions,
        theme,
        clientType,
        partnerId,
      }}
    >
      {children}
    </B3Context.Provider>
  );
}