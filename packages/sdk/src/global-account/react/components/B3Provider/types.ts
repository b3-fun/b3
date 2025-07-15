import { User } from "@b3dotfun/sdk/global-account/types/b3-api.types";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { createContext } from "react";
import { Account } from "thirdweb/wallets";
import { Wallet } from "thirdweb/wallets";

/**
 * Context type for B3Provider
 */
export interface B3ContextType {
  account?: Account;
  automaticallySetFirstEoa: boolean;
  user?: User;
  setAccount: (account: Account) => void;
  setWallet: (wallet: Wallet) => void;
  wallet?: Wallet;
  setUser: (user?: User) => void;
  initialized: boolean;
  ready: boolean;
  environment?: "development" | "production";
  defaultPermissions?: PermissionsConfig;
  theme: "light" | "dark";
}

/**
 * Context for B3 provider
 */
export const B3Context = createContext<B3ContextType>({
  account: undefined,
  automaticallySetFirstEoa: false,
  user: undefined,
  setAccount: () => {},
  setWallet: () => {},
  wallet: undefined,
  setUser: () => {},
  initialized: false,
  ready: false,
  environment: "development",
  theme: "light",
});
