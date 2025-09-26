import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import { Wallet } from "thirdweb/wallets";
import { useB3 } from "../components/B3Provider/useB3";
import { useSiwe } from "./useSiwe";
import { useAuthStore } from "../stores/useAuthStore";
import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";

const debug = debugB3React("useOnConnect");

export function useOnConnect() {
  const { authenticate } = useSiwe();
  const { partnerId, setUser } = useB3();
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const setIsConnecting = useAuthStore(state => state.setIsConnecting);
  const setIsConnected = useAuthStore(state => state.setIsConnected);
  const setHasStartedConnecting = useAuthStore(state => state.setHasStartedConnecting);

  const handleConnect = useCallback(
    async (wallet: Wallet) => {
      setHasStartedConnecting(true);
      setIsConnecting(true);

      try {
        setIsConnected(true);
        debug("setIsAuthenticating:true");
        setIsAuthenticating(true);

        const account = await wallet.getAccount();
        if (!account) {
          throw new Error("No account found during connect");
        }

        // Try to re-authenticate first
        try {
          const userAuth = await app.reAuthenticate();
          setUser(userAuth.user);
          setIsAuthenticated(true);
          debug("Re-authenticated successfully", { userAuth });

          // Authenticate on BSMNT with B3 JWT
          const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
          console.log("@@b3Jwt", b3Jwt);
        } catch (error) {
          // If re-authentication fails, try fresh authentication
          debug("Re-authentication failed, attempting fresh authentication");
          const userAuth = await authenticate(account, partnerId);
          setUser(userAuth.user);
          setIsAuthenticated(true);
          debug("Fresh authentication successful", { userAuth });

          // Authenticate on BSMNT with B3 JWT
          const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
          console.log("@@b3Jwt", b3Jwt);
        }
      } catch (error) {
        debug("Connect authentication failed", { error });
        setIsAuthenticated(false);
        setUser(undefined);
      } finally {
        setIsAuthenticating(false);
        setIsConnecting(false);
      }
    },
    [
      authenticate,
      partnerId,
      setUser,
      setIsAuthenticated,
      setIsAuthenticating,
      setIsConnecting,
      setIsConnected,
      setHasStartedConnecting,
    ],
  );

  return handleConnect;
}
