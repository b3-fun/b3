import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { Account, Wallet } from "thirdweb/wallets";

import { ClientType } from "../../../client-manager";

import { WagmiProvider } from "wagmi";
import { useB3ConfigStore } from "../../stores/configStore";
import { createWagmiConfig } from "../../utils/createWagmiConfig";
import AuthenticationProvider from "./AuthenticationProvider";
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
  const setConfig = useB3ConfigStore(state => state.setConfig);

  // Initialize config store on mount - props are static and never change
  useEffect(() => {
    setConfig({
      accountOverride,
      environment: environment ?? "development",
      automaticallySetFirstEoa: false,
      theme,
      clientType,
      partnerId,
      defaultPermissions,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThirdwebProvider>
      <LocalSDKProvider onConnectCallback={onConnect}>
        {/* <RelayKitProviderWrapper> */}
        {children}
        <AuthenticationProvider partnerId={partnerId} automaticallySetFirstEoa={false} />
        {/* </RelayKitProviderWrapper> */}
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
  const setConfig = useB3ConfigStore(state => state.setConfig);
  const wagmiConfig = createWagmiConfig({ partnerId, rpcUrls });

  // Initialize config store on mount - props are static and never change
  useEffect(() => {
    setConfig({
      accountOverride,
      environment: environment ?? "development",
      automaticallySetFirstEoa: false,
      theme,
      clientType,
      partnerId,
      defaultPermissions,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
