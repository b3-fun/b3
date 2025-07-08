import { User } from "@b3dotfun/sdk/global-account/types/b3-api.types";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ThirdwebProvider, useActiveAccount, useConnectedWallets, useSetActiveWallet } from "thirdweb/react";
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
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year from now
};

export const wagmiConfig = createConfig({
  chains: [supportedChains[0], ...supportedChains.slice(1)],
  transports: Object.fromEntries(supportedChains.map(chain => [chain.id, http()])) as any
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
  automaticallySetFirstEoa
}: {
  isMainnetAnySpend?: boolean;
  theme: "light" | "dark";
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  automaticallySetFirstEoa?: boolean;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThirdwebProvider>
          <InnerProvider
            accountOverride={accountOverride}
            environment={environment}
            theme={theme}
            automaticallySetFirstEoa={!!automaticallySetFirstEoa}
          >
            <RelayKitProviderWrapper isMainnet={isMainnetAnySpend}>
              <StyleRoot id="b3-root" />
              {children}
              <Toaster theme={theme} />
            </RelayKitProviderWrapper>
          </InnerProvider>
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
  theme = "light"
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  defaultPermissions?: PermissionsConfig;
  automaticallySetFirstEoa: boolean;
  theme: "light" | "dark";
}) {
  const activeAccount = useActiveAccount();
  const [manuallySetAccount, setManuallySetAccount] = useState<Account | undefined>(undefined);
  const [manuallySelectedWallet, setManuallySelectedWallet] = useState<Wallet | undefined>(undefined);
  const wallets = useConnectedWallets();
  const setActiveWallet = useSetActiveWallet();

  const [user, setUser] = useState<User | undefined>(undefined);

  // Use given accountOverride or activeAccount from thirdweb
  const effectiveAccount = accountOverride || manuallySetAccount || activeAccount;

  const setAccount = (account: Account) => {
    setManuallySetAccount(account);
  };

  const setWallet = (wallet: Wallet) => {
    setManuallySelectedWallet(wallet);
    const account = wallet.getAccount();
    setManuallySetAccount(account);
    console.log("@@gio:setWallet", wallet.id, account?.address);
    setActiveWallet(wallet);
  };

  const setFirstEoa = () => {
    const firstEoa = wallets.find(wallet => ["com.coinbase.wallet", "io.metamask"].includes(wallet.id));
    if (firstEoa) {
      setWallet(firstEoa);
    }
  };

  useEffect(() => {
    if (automaticallySetFirstEoa) {
      console.log("@@gio:wallets", wallets);
      setFirstEoa();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [automaticallySetFirstEoa, wallets]);

  return (
    <B3Context.Provider
      value={{
        account: effectiveAccount,
        setAccount,
        setWallet,
        wallet: manuallySelectedWallet,
        user,
        setUser,
        initialized: true,
        ready: !!effectiveAccount,
        automaticallySetFirstEoa,
        environment,
        defaultPermissions,
        theme
      }}
    >
      {children}
    </B3Context.Provider>
  );
}
