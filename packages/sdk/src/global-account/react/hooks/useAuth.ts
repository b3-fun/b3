import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback } from "react";
import app from "../../app";
import { useSearchParam } from "./useSearchParamsSSR";

const debug = debugB3React("useAuth");

/**
 * Unified authentication hook that uses Turnkey for authentication
 * This replaces the previous Thirdweb-based authentication
 */
export function useAuth() {
  const referralCode = useSearchParam("referralCode");

  /**
   * Authenticate with Turnkey using email OTP
   * This is the primary authentication method, replacing Thirdweb wallet-based auth
   */
  const authenticate = useCallback(
    async (turnkeySessionJwt: string, partnerId: string) => {
      if (!turnkeySessionJwt) {
        throw new Error("Turnkey session JWT is required");
      }

      debug("Authenticating with Turnkey JWT", { referralCode, partnerId });

      try {
        const response = await app.authenticate({
          strategy: "turnkey-jwt",
          accessToken: turnkeySessionJwt,
          referralCode,
          partnerId: partnerId,
        } as any);

        debug("Authentication successful", response);
        return response;
      } catch (err: any) {
        debug("Authentication failed", err);
        throw err;
      }
    },
    [referralCode],
  );

  /**
   * Re-authenticate using existing session
   */
  const reAuthenticate = useCallback(async () => {
    debug("Re-authenticating...");
    try {
      const response = await app.reAuthenticate();
      debug("Re-authentication successful", response);
      return response;
    } catch (err: any) {
      debug("Re-authentication failed", err);
      throw err;
    }
  }, []);

  return {
    authenticate,
    reAuthenticate,
  };
}
