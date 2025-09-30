import {
  Loading,
  useAuthentication,
  useAuthStore,
  useB3,
  useHandleConnectWithPrivy,
} from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect } from "react";
import type { Chain } from "thirdweb";
import { Account } from "thirdweb/wallets";

const debug = debugB3React("SignInWithB3Privy");
interface SignInWithB3PrivyProps {
  onError?: (error: Error) => Promise<void>;
  onSuccess: (account: Account) => Promise<void>;
  accessToken?: string;
  chain: Chain;
}

export function SignInWithB3Privy({ onSuccess, onError, chain }: SignInWithB3PrivyProps) {
  const { partnerId } = useB3();
  const { isLoading, connectTw, fullToken } = useHandleConnectWithPrivy(partnerId, chain, onSuccess);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const { logout } = useAuthentication();

  debug("@@SignInWithB3Privy", {
    isLoading,
    fullToken,
  });

  useEffect(() => {
    async function autoConnect() {
      try {
        const connectResult = await connectTw();
        const account = connectResult?.getAccount();
        if (!account) {
          setIsAuthenticated(false);
          return;
        }
        await onSuccess(account);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to connect:", error);
        await onError?.(error as Error);
        await logout();
        setIsAuthenticated(false);
      } finally {
        debug("setIsAuthenticating:false:7");
        setIsAuthenticating(false);
      }
    }
    autoConnect();
  }, [connectTw, onSuccess, onError, setIsAuthenticated, logout, setIsAuthenticating]);

  // Currently we auto login, so we can show loading immediately and the onSuccess will proceed to the next modal
  return (
    <div className="flex aspect-square items-center justify-center p-6">
      <Loading variant="white" size="lg" />
    </div>
  );
}
