import { CreateOnrampOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOnrampOrder";
import { CreateOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { createContext, useContext } from "react";
import { Account } from "thirdweb/wallets";
import { ClientType } from "../../../client-manager";

/**
 * Default permissions configuration for B3 provider
 */
const DEFAULT_PERMISSIONS: PermissionsConfig = {
  approvedTargets: ["0xa8e42121e318e3D3BeD7f5969AF6D360045317DD"],
  nativeTokenLimitPerTransaction: 0.1,
  startDate: new Date(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
};

export interface B3ConfigContextType {
  accountOverride?: Account;
  automaticallySetFirstEoa: boolean;
  environment: "development" | "production";
  defaultPermissions: PermissionsConfig;
  theme: "light" | "dark";
  clientType: ClientType;
  partnerId: string;
  stripePublishableKey?: string;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;
}

const B3ConfigContext = createContext<B3ConfigContextType | null>(null);

export function B3ConfigProvider({
  children,
  accountOverride,
  environment = "development",
  defaultPermissions = DEFAULT_PERMISSIONS,
  automaticallySetFirstEoa = false,
  theme = "light",
  clientType = "rest",
  partnerId,
  stripePublishableKey,
  createClientReferenceId,
}: {
  children: React.ReactNode;
  accountOverride?: Account;
  environment?: "development" | "production";
  defaultPermissions?: PermissionsConfig;
  automaticallySetFirstEoa?: boolean;
  theme?: "light" | "dark";
  clientType?: ClientType;
  partnerId: string;
  stripePublishableKey?: string;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;
}) {
  return (
    <B3ConfigContext.Provider
      value={{
        accountOverride,
        environment,
        defaultPermissions,
        automaticallySetFirstEoa,
        theme,
        clientType,
        partnerId,
        stripePublishableKey,
        createClientReferenceId,
      }}
    >
      {children}
    </B3ConfigContext.Provider>
  );
}

export function useB3Config(): B3ConfigContextType {
  const context = useContext(B3ConfigContext);
  if (!context) {
    throw new Error("useB3Config must be used within a B3ConfigProvider");
  }
  return context;
}
