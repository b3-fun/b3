import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThirdwebProvider } from "thirdweb/react";
import { Account, Wallet } from "thirdweb/wallets";

import { ClientType } from "../../../client-manager";

import { WagmiProvider } from "wagmi";
import { createWagmiConfig } from "../../utils/createWagmiConfig";
import AuthenticationProvider from "./AuthenticationProvider";
import { B3ConfigProvider } from "./B3ConfigProvider";
import { LocalSDKProvider } from "./LocalSDKProvider";

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
  defaultPermissions,
}: {
  theme: "light" | "dark";
  children: React.ReactNode;
  accountOverride?: Account;
  environment?: "development" | "production";
  clientType?: ClientType;
  partnerId: string;
  rpcUrls?: Record<number, string>;
  onConnect?: (wallet: Wallet, b3Jwt: string) => void | Promise<void>;
  defaultPermissions?: PermissionsConfig;
}) {
  return (
    <ThirdwebProvider>
      <LocalSDKProvider onConnectCallback={onConnect}>
        <B3ConfigProvider
          accountOverride={accountOverride}
          environment={environment}
          automaticallySetFirstEoa={false}
          theme={theme}
          clientType={clientType}
          partnerId={partnerId}
          defaultPermissions={defaultPermissions}
        >
          {/* <RelayKitProviderWrapper> */}
          {children}
          <AuthenticationProvider partnerId={partnerId} automaticallySetFirstEoa={false} />
          {/* </RelayKitProviderWrapper> */}
        </B3ConfigProvider>
      </LocalSDKProvider>
    </ThirdwebProvider>
  );
}

/**
 * Inner provider component for native
 */
export function InnerProvider({
  children,
  accountOverride,
  environment,
  defaultPermissions,
  theme = "light",
  clientType = "socket",
  partnerId,
  rpcUrls,
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment?: "development" | "production";
  defaultPermissions?: PermissionsConfig;
  theme: "light" | "dark";
  clientType?: ClientType;
  partnerId: string;
  rpcUrls?: Record<number, string>;
}) {
  const wagmiConfig = createWagmiConfig({ partnerId, rpcUrls });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <B3ConfigProvider
          accountOverride={accountOverride}
          environment={environment}
          automaticallySetFirstEoa={false}
          theme={theme}
          clientType={clientType}
          partnerId={partnerId}
          defaultPermissions={defaultPermissions}
        >
          {children}
        </B3ConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
