import {
  RelayKitProviderWrapper,
  TooltipProvider,
  useAuthentication,
  useAuthStore,
} from "@b3dotfun/sdk/global-account/react";
import { useWagmiConfig } from "@b3dotfun/sdk/global-account/react/hooks/useWagmiConfig";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { loadGA4Script } from "@b3dotfun/sdk/global-account/utils/analytics";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import "@reservoir0x/relay-kit-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import {
  getLastAuthProvider,
  ThirdwebProvider,
  useActiveAccount,
  useConnectedWallets,
  useSetActiveWallet,
} from "thirdweb/react";
import { Account, Wallet } from "thirdweb/wallets";
import { useAccount, WagmiProvider } from "wagmi";
import { ClientType, setClientType } from "../../../client-manager";
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
}) {
  // Initialize Google Analytics on mount
  useEffect(() => {
    loadGA4Script();
  }, []);

  // Set the client type when provider mounts
  useEffect(() => {
    setClientType(clientType);
  }, [clientType]);

  return (
    <ThirdwebProvider>
      <TooltipProvider>
        <InnerProvider
          accountOverride={accountOverride}
          environment={environment}
          theme={theme}
          automaticallySetFirstEoa={!!automaticallySetFirstEoa}
          clientType={clientType}
          partnerId={partnerId}
          rpcUrls={rpcUrls}
        >
          <RelayKitProviderWrapper simDuneApiKey={simDuneApiKey}>
            {children}
            {/* For the modal https://github.com/b3-fun/b3/blob/main/packages/sdk/src/global-account/react/components/ui/dialog.tsx#L46 */}
            <StyleRoot id="b3-root" />
            <Toaster theme={theme} position={toaster?.position} style={toaster?.style} />
          </RelayKitProviderWrapper>
        </InnerProvider>
      </TooltipProvider>
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
  rpcUrls,
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  defaultPermissions?: PermissionsConfig;
  automaticallySetFirstEoa: boolean;
  theme: "light" | "dark";
  clientType?: ClientType;
  partnerId: string;
  rpcUrls?: Record<number, string>;
}) {
  const activeAccount = useActiveAccount();
  const [manuallySelectedWallet, setManuallySelectedWallet] = useState<Wallet | undefined>(undefined);
  const wallets = useConnectedWallets();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isConnected = useAuthStore(state => state.isConnected);
  const setActiveWallet = useSetActiveWallet();
  const { user, setUser, refetchUser } = useAuthentication(partnerId);
  const wagmiConfig = useWagmiConfig(partnerId, rpcUrls);

  debug("@@B3Provider:isConnected", isConnected);
  debug("@@wallets", wallets);
  debug("@@B3Provider:user", user);

  // Use given accountOverride or activeAccount from thirdweb
  const effectiveAccount = isAuthenticated ? accountOverride || activeAccount : undefined;

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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <B3Context.Provider
          value={{
            account: effectiveAccount,
            setWallet,
            wallet: manuallySelectedWallet,
            user,
            setUser,
            refetchUser,
            initialized: true,
            ready: !!effectiveAccount && wagmiConfig.state.status !== "connecting",
            automaticallySetFirstEoa,
            environment,
            defaultPermissions,
            theme,
            clientType,
            partnerId: partnerId,
          }}
        >
          <InnerProvider2>{children}</InnerProvider2>
        </B3Context.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

const InnerProvider2 = ({ children }: { children: React.ReactNode }) => {
  const account = useAccount();
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);

  useEffect(() => {
    if (account.isDisconnected) {
      setIsAuthenticating(false);
    }
  }, [account, setIsAuthenticating]);
  return <>{children}</>;
};
