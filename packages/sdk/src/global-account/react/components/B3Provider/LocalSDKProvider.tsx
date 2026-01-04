import { Users } from "@b3dotfun/b3-api";
import { createContext } from "react";
import { Wallet } from "thirdweb/wallets";

/**
 * Local SDK Context for internal SDK state (like authentication callbacks)
 * This context is separate from B3Context and is available before B3Context.Provider is instantiated
 */
export interface LocalSDKContextType {
  onConnectCallback?: (wallet: Wallet, b3Jwt: string) => void | Promise<void>;
  onLogoutCallback?: () => void | Promise<void>;
  onTurnkeyConnect?: (user: Users) => void | Promise<void>;
}

export const LocalSDKContext = createContext<LocalSDKContextType>({
  onConnectCallback: undefined,
  onLogoutCallback: undefined,
  onTurnkeyConnect: undefined,
});

/**
 * Local SDK Provider that wraps the app and provides internal SDK state
 */
export function LocalSDKProvider({
  children,
  onConnectCallback,
  onLogoutCallback,
  onTurnkeyConnect,
}: {
  children: React.ReactNode;
  onConnectCallback?: (wallet: Wallet, b3Jwt: string) => void | Promise<void>;
  onLogoutCallback?: () => void | Promise<void>;
  onTurnkeyConnect?: (user: Users) => void | Promise<void>;
}) {
  return (
    <LocalSDKContext.Provider
      value={{
        onConnectCallback,
        onLogoutCallback,
        onTurnkeyConnect,
      }}
    >
      {children}
    </LocalSDKContext.Provider>
  );
}
