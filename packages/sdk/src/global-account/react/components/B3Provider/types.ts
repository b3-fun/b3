import { Users } from "@b3dotfun/b3-api";
import { CreateOnrampOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOnrampOrder";
import { CreateOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { createContext } from "react";
import { Account, Wallet } from "thirdweb/wallets";
import { ClientType } from "../../../client-manager";

/**
 * Context type for B3Provider
 */
export interface B3ContextType {
  account?: Account;
  automaticallySetFirstEoa: boolean;
  user?: Users;
  setWallet: (wallet: Wallet) => void;
  wallet?: Wallet;
  setUser: (user?: Users) => void;
  refetchUser: () => Promise<any>;
  initialized: boolean;
  ready: boolean;
  environment?: "development" | "production";
  defaultPermissions?: PermissionsConfig;
  theme: "light" | "dark";
  clientType: ClientType;
  partnerId: string;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;
  enableTurnkey?: boolean;
}

/**
 * Context for B3 provider
 */
export const B3Context = createContext<B3ContextType>({
  account: undefined,
  automaticallySetFirstEoa: false,
  user: undefined,
  setWallet: () => {},
  wallet: undefined,
  setUser: () => {},
  refetchUser: async () => {},
  initialized: false,
  ready: false,
  environment: "development",
  theme: "light",
  clientType: "rest",
  partnerId: "",
  createClientReferenceId: undefined,
  enableTurnkey: false,
});
