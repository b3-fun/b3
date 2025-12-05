import { CreateOnrampOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOnrampOrder";
import { CreateOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import {
  RelayKitProviderWrapper,
  TooltipProvider,
  useAuthentication,
  useAuthStore,
} from "@b3dotfun/sdk/global-account/react";
import { useAutoSelectWallet } from "@b3dotfun/sdk/global-account/react/hooks/useAutoSelectWallet";
import { createWagmiConfig } from "@b3dotfun/sdk/global-account/react/utils/createWagmiConfig";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { loadGA4Script } from "@b3dotfun/sdk/global-account/utils/analytics";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import "@relayprotocol/relay-kit-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { ThirdwebProvider, useActiveAccount, useSetActiveWallet } from "thirdweb/react";
import { Account, Wallet } from "thirdweb/wallets";
import { CreateConnectorFn, WagmiProvider } from "wagmi";
import { ClientType, setClientType } from "../../../client-manager";
import { StyleRoot } from "../StyleRoot";
import { setToastContext, ToastProvider, useToastContext } from "../Toast/index";
import { LocalSDKProvider } from "./LocalSDKProvider";
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
  // deprecated since v0.0.87
  toaster: _toaster,
  clientType = "rest",
  rpcUrls,
  partnerId,
  onConnect,
  connectors,
  overrideDefaultConnectors = false,
  createClientReferenceId,
  enableTurnkey = false,
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
  onConnect?: (wallet: Wallet, b3Jwt: string) => void | Promise<void>;
  connectors?: CreateConnectorFn[];
  overrideDefaultConnectors?: boolean;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;
  enableTurnkey?: boolean;
}) {
  // Initialize Google Analytics on mount
  useEffect(() => {
    loadGA4Script();
  }, []);

  // Set the client type when provider mounts
  useEffect(() => {
    setClientType(clientType);
  }, [clientType]);
  const wagmiConfig = createWagmiConfig({ partnerId, rpcUrls, connectors, overrideDefaultConnectors });

  return (
    <ThirdwebProvider>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ToastProvider>
              <LocalSDKProvider onConnectCallback={onConnect}>
                <InnerProvider
                  accountOverride={accountOverride}
                  environment={environment}
                  theme={theme}
                  automaticallySetFirstEoa={!!automaticallySetFirstEoa}
                  clientType={clientType}
                  partnerId={partnerId}
                  createClientReferenceId={createClientReferenceId}
                  enableTurnkey={enableTurnkey}
                >
                  <ToastContextConnector />
                  <RelayKitProviderWrapper simDuneApiKey={simDuneApiKey}>
                    {children}
                    {/* For the modal https://github.com/b3-fun/b3/blob/main/packages/sdk/src/global-account/react/components/ui/dialog.tsx#L46 */}
                    <StyleRoot id="b3-root" />
                  </RelayKitProviderWrapper>
                </InnerProvider>
              </LocalSDKProvider>
            </ToastProvider>
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
  createClientReferenceId,
  enableTurnkey,
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment: B3ContextType["environment"];
  defaultPermissions?: PermissionsConfig;
  automaticallySetFirstEoa: boolean;
  theme: "light" | "dark";
  clientType?: ClientType;
  partnerId: string;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;
  enableTurnkey?: boolean;
}) {
  const activeAccount = useActiveAccount();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isConnected = useAuthStore(state => state.isConnected);
  const justCompletedLogin = useAuthStore(state => state.justCompletedLogin);
  const setActiveWallet = useSetActiveWallet();
  const { user, setUser, refetchUser } = useAuthentication(partnerId);

  debug("@@B3Provider:isConnected", isConnected);
  debug("@@B3Provider:user", user);
  debug("@@B3Provider:justCompletedLogin", justCompletedLogin);

  // Use given accountOverride or activeAccount from thirdweb
  // WOJ: why if isAuthenticated is false, we don't use activeAccount, which should be undefined?
  // skip isAuthenticated check ?
  const effectiveAccount = isAuthenticated ? accountOverride || activeAccount : undefined;

  // Wrapper to set active wallet via thirdweb
  // Note: `wallet` in context is deprecated - use useActiveWallet() from thirdweb/react instead
  const setWallet = useCallback(
    (wallet: Wallet) => {
      debug("@@setWallet", wallet.id, wallet.getAccount()?.address);
      setActiveWallet(wallet);
    },
    [setActiveWallet],
  );

  // Auto-select first EOA wallet when enabled
  useAutoSelectWallet({
    enabled: automaticallySetFirstEoa,
    isAuthenticated,
    onSelectWallet: setWallet,
  });

  return (
    <B3Context.Provider
      value={{
        account: effectiveAccount,
        setWallet,
        wallet: undefined, // Deprecated: use useActiveWallet() from thirdweb/react instead
        user,
        setUser,
        refetchUser,
        initialized: true,
        ready: !!effectiveAccount,
        automaticallySetFirstEoa,
        environment,
        defaultPermissions,
        theme,
        clientType,
        partnerId: partnerId,
        createClientReferenceId,
        enableTurnkey,
      }}
    >
      {children}
    </B3Context.Provider>
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
