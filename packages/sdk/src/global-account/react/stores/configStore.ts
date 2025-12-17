import { CreateOnrampOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOnrampOrder";
import { CreateOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { Account } from "thirdweb/wallets";
import { create } from "zustand";
import { ClientType } from "../../client-manager";

/**
 * Default permissions configuration for B3 provider
 */
const DEFAULT_PERMISSIONS: PermissionsConfig = {
  approvedTargets: ["0xa8e42121e318e3D3BeD7f5969AF6D360045317DD"],
  nativeTokenLimitPerTransaction: 0.1,
  startDate: new Date(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
};

interface ConfigStore {
  accountOverride?: Account;
  automaticallySetFirstEoa: boolean;
  environment: "development" | "production";
  defaultPermissions: PermissionsConfig;
  theme: "light" | "dark";
  clientType: ClientType;
  partnerId: string;
  stripePublishableKey?: string;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;
  enableTurnkey: boolean;

  // Actions
  setConfig: (config: Partial<Omit<ConfigStore, "setConfig">>) => void;
}

/**
 * Zustand store for B3 configuration
 * NOT persisted - these are developer-set configuration values
 */
export const useB3ConfigStore = create<ConfigStore>(set => ({
  accountOverride: undefined,
  automaticallySetFirstEoa: false,
  environment: "development",
  defaultPermissions: DEFAULT_PERMISSIONS,
  theme: "light",
  clientType: "rest",
  partnerId: "",
  stripePublishableKey: undefined,
  createClientReferenceId: undefined,
  enableTurnkey: false,

  setConfig: config => set(state => ({ ...state, ...config })),
}));
