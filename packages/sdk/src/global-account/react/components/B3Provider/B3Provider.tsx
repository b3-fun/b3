import { CreateOnrampOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOnrampOrder";
import { CreateOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { RelayKitProviderWrapper, TooltipProvider } from "@b3dotfun/sdk/global-account/react";
import { createWagmiConfig } from "@b3dotfun/sdk/global-account/react/utils/createWagmiConfig";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { loadGA4Script } from "@b3dotfun/sdk/global-account/utils/analytics";
import "@relayprotocol/relay-kit-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { Account, Wallet } from "thirdweb/wallets";
import { CreateConnectorFn, WagmiProvider } from "wagmi";
import { ClientType, setClientType } from "../../../client-manager";
import { useB3ConfigStore } from "../../stores/configStore";
import { StyleRoot } from "../StyleRoot";
import { setToastContext, ToastProvider, useToastContext } from "../Toast/index";
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
  automaticallySetFirstEoa,
  simDuneApiKey,
  // deprecated since v0.0.87
  toaster: _toaster,
  clientType = "rest",
  rpcUrls,
  partnerId,
  stripePublishableKey,
  onConnect,
  connectors,
  overrideDefaultConnectors = false,
  createClientReferenceId,
  enableTurnkey = false,
  defaultPermissions,
}: {
  theme: "light" | "dark";
  children: React.ReactNode;
  accountOverride?: Account;
  environment?: "development" | "production";
  automaticallySetFirstEoa?: boolean;
  simDuneApiKey?: string;
  toaster?: {
    position?: "top-center" | "top-right" | "bottom-center" | "bottom-right";
    style?: React.CSSProperties;
  };
  clientType?: ClientType;
  rpcUrls?: Record<number, string>;
  partnerId: string;
  /** Partner-specific Stripe publishable key. If not provided, uses default B3 Stripe account. */
  stripePublishableKey?: string;
  onConnect?: (wallet: Wallet, b3Jwt: string) => void | Promise<void>;
  connectors?: CreateConnectorFn[];
  overrideDefaultConnectors?: boolean;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;
  enableTurnkey?: boolean;
  defaultPermissions?: PermissionsConfig;
}) {
  const setConfig = useB3ConfigStore(state => state.setConfig);

  // Initialize config store on mount - props are static and never change
  useEffect(() => {
    setConfig({
      accountOverride,
      environment: environment ?? "development",
      automaticallySetFirstEoa: !!automaticallySetFirstEoa,
      theme,
      clientType,
      partnerId,
      stripePublishableKey,
      createClientReferenceId,
      enableTurnkey,
      defaultPermissions,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize Google Analytics on mount
  useEffect(() => {
    loadGA4Script();
  }, []);

  // Set the client type when provider mounts
  useEffect(() => {
    setClientType(clientType);
  }, [clientType]);

  const wagmiConfig = useMemo(
    () => createWagmiConfig({ partnerId, rpcUrls, connectors, overrideDefaultConnectors }),
    [partnerId, rpcUrls, connectors, overrideDefaultConnectors],
  );

  return (
    <ThirdwebProvider>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ToastProvider>
              <LocalSDKProvider onConnectCallback={onConnect}>
                <ToastContextConnector />
                <RelayKitProviderWrapper simDuneApiKey={simDuneApiKey}>
                  {children}
                  {/* For the modal https://github.com/b3-fun/b3/blob/main/packages/sdk/src/global-account/react/components/ui/dialog.tsx#L46 */}
                  <StyleRoot id="b3-root" />
                </RelayKitProviderWrapper>
                <AuthenticationProvider partnerId={partnerId} automaticallySetFirstEoa={!!automaticallySetFirstEoa} />
              </LocalSDKProvider>
            </ToastProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThirdwebProvider>
  );
}

/**
 * Component to connect the toast context to the global toast API
 */
function ToastContextConnector() {
  const toastContext = useToastContext();

  useEffect(() => {
    setToastContext({
      addToast: toastContext.addToast,
      removeToast: toastContext.removeToast,
      clearAll: toastContext.clearAll,
    });
  }, [toastContext]);

  return null;
}
