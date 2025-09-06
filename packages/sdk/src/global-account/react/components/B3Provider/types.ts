import { Users } from "@b3dotfun/b3-api";
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
  initialized: boolean;
  ready: boolean;
  environment?: "development" | "production";
  defaultPermissions?: PermissionsConfig;
  theme: "light" | "dark";
  clientType: ClientType;
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
  initialized: false,
  ready: false,
  environment: "development",
  theme: "light",
  clientType: "rest",
});
