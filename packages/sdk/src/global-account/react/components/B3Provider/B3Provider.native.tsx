import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThirdwebProvider, useActiveAccount } from "thirdweb/react";
import { Account } from "thirdweb/wallets";

import { Users } from "@b3dotfun/b3-api";
import { ClientType } from "../../../client-manager";

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
}: {
  theme: "light" | "dark";
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  clientType?: ClientType;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider>
        <InnerProvider
          accountOverride={accountOverride}
          environment={environment}
          theme={theme}
          clientType={clientType}
        >
          {/* <RelayKitProviderWrapper> */}
          {children}
          {/* </RelayKitProviderWrapper> */}
        </InnerProvider>
      </ThirdwebProvider>
    </QueryClientProvider>
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
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  defaultPermissions?: PermissionsConfig;
  theme: "light" | "dark";
  clientType?: ClientType;
}) {
  const activeAccount = useActiveAccount();
  const [user, setUser] = useState<Users | undefined>(undefined);

  // Use given accountOverride or activeAccount from thirdweb
  const effectiveAccount = accountOverride || activeAccount;

  return (
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
      }}
    >
      {children}
    </B3Context.Provider>
  );
}
