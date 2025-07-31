import { TooltipProvider, useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { User } from "@b3dotfun/sdk/global-account/types/b3-api.types";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
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
import { createConfig, http, WagmiProvider } from "wagmi";
import { RelayKitProviderWrapper } from "../RelayKitProviderWrapper";
import { StyleRoot } from "../StyleRoot";
import { B3Context, B3ContextType } from "./types";

import "@reservoir0x/relay-kit-ui/styles.css";

/**
 * Default permissions configuration for B3 provider
 */
const DEFAULT_PERMISSIONS = {
  approvedTargets: ["0xa8e42121e318e3D3BeD7f5969AF6D360045317DD"], // Example contract
  nativeTokenLimitPerTransaction: 0.1, // in ETH
  startDate: new Date(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
};

export const wagmiConfig = createConfig({
  chains: [supportedChains[0], ...supportedChains.slice(1)],
  transports: Object.fromEntries(supportedChains.map(chain => [chain.id, http()])) as any,
});

// Create queryClient instance
const queryClient = new QueryClient();

/**
 * Main B3Provider component
 */
export function B3Provider({
  isMainnetAnySpend = true,
  theme = "light",
  children,
  accountOverride,
  environment,
  automaticallySetFirstEoa,
  toaster
}: {
  isMainnetAnySpend?: boolean;
  theme: "light" | "dark";
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  automaticallySetFirstEoa?: boolean;
  toaster?: {
    position?: "top-center" | "top-right" | "bottom-center" | "bottom-right";
    style?: React.CSSProperties;
  };
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThirdwebProvider>
          <TooltipProvider>
            <InnerProvider
              accountOverride={accountOverride}
              environment={environment}
              theme={theme}
              automaticallySetFirstEoa={!!automaticallySetFirstEoa}
            >
              <RelayKitProviderWrapper isMainnet={isMainnetAnySpend}>
                {children}
                {/* For the modal https://github.com/b3-fun/b3/blob/main/packages/sdk/src/global-account/react/components/ui/dialog.tsx#L46 */}
                <StyleRoot id="b3-root" />
                <Toaster theme={theme} position={toaster?.position} style={toaster?.style} />
              </RelayKitProviderWrapper>
            </InnerProvider>
          </TooltipProvider>
        </ThirdwebProvider>
      </QueryClientProvider>
    </WagmiProvider>
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
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  defaultPermissions?: PermissionsConfig;
  automaticallySetFirstEoa: boolean;
  theme: "light" | "dark";
}) {
  const activeAccount = useActiveAccount();
  const [manuallySelectedWallet, setManuallySelectedWallet] = useState<Wallet | undefined>(undefined);
  const wallets = useConnectedWallets();
  const setActiveWallet = useSetActiveWallet();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [user, setUser] = useState<User | undefined>(undefined);

  // Use given accountOverride or activeAccount from thirdweb
  const effectiveAccount = isAuthenticated ? accountOverride || activeAccount : undefined;

  const setWallet = useCallback(
    (wallet: Wallet) => {
      setManuallySelectedWallet(wallet);
      const account = wallet.getAccount();
      console.log("@@gio:setWallet", wallet.id, account?.address);
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
      }}
    >
      {children}
    </B3Context.Provider>
  );
}
