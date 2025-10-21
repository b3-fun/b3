import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThirdwebProvider, useActiveAccount } from "thirdweb/react";
import { Account } from "thirdweb/wallets";

import { ClientType } from "../../../client-manager";

import { WagmiProvider } from "wagmi";
import { useAuthentication } from "../../hooks/useAuthentication";
import { useWagmiConfig } from "../../hooks/useWagmiConfig";
import { LocalSDKProvider } from "./LocalSDKProvider";
import { B3Context, B3ContextType } from "./types";

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
  clientType = "socket",
  partnerId,
  rpcUrls,
  onConnect,
}: {
  theme: "light" | "dark";
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  clientType?: ClientType;
  partnerId: string;
  rpcUrls?: Record<number, string>;
  onConnect?: (wallet: Wallet, b3Jwt: string) => void | Promise<void>;
}) {
  return (
    <ThirdwebProvider>
      <LocalSDKProvider onConnectCallback={onConnect}>
        <InnerProvider
          accountOverride={accountOverride}
          environment={environment}
          theme={theme}
          clientType={clientType}
          partnerId={partnerId}
          rpcUrls={rpcUrls}
        >
          {/* <RelayKitProviderWrapper> */}
          {children}
          {/* </RelayKitProviderWrapper> */}
        </InnerProvider>
      </LocalSDKProvider>
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
  theme = "light",
  clientType = "socket",
  partnerId,
  rpcUrls,
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  defaultPermissions?: PermissionsConfig;
  theme: "light" | "dark";
  clientType?: ClientType;
  partnerId: string;
  rpcUrls?: Record<number, string>;
}) {
  const activeAccount = useActiveAccount();
  const { user, setUser, refetchUser } = useAuthentication(partnerId);
  const wagmiConfig = useWagmiConfig(partnerId, rpcUrls);

  // Use given accountOverride or activeAccount from thirdweb
  const effectiveAccount = accountOverride || activeAccount;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <B3Context.Provider
          value={{
            account: effectiveAccount,
            automaticallySetFirstEoa: false,
            setWallet: () => {},
            wallet: undefined,
            user,
            setUser,
            initialized: true,
            ready: !!effectiveAccount,
            environment,
            defaultPermissions,
            theme,
            clientType,
            partnerId,
            refetchUser,
          }}
        >
          {children}
        </B3Context.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
