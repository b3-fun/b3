import { TurnkeyAuthInitResponse } from "@b3dotfun/b3-api";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback, useState } from "react";
import app from "../../app";
import { useB3Config } from "../components";
import { useAuthStore } from "../stores";
import { useAuthentication } from "./useAuthentication";

const debug = debugB3React("useTurnkeyAuth");

interface TurnkeyVerifyResponse {
  turnkeySessionJwt: string;
}

interface UseTurnkeyAuthReturn {
  initiateLogin: (_email: string) => Promise<TurnkeyAuthInitResponse>;
  verifyOtp: (_otpId: string, _otpCode: string) => Promise<{ user: any }>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for Turnkey email-based OTP authentication
 *
 * Usage:
 * 1. Call initiateLogin(email) → User receives OTP email
 * 2. Call verifyOtp(...) → Verifies OTP and authenticates with b3-api
 * 3. User is authenticated, JWT stored in cookies automatically
 */
export function useTurnkeyAuth(): UseTurnkeyAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const { partnerId } = useB3Config();
  const { user } = useAuthentication(partnerId);

  /**
   * Step 1: Initiate login with email
   * - Calls backend to create sub-org (if needed) and send OTP
   * - Returns otpId to use in verification step
   */
  const initiateLogin = useCallback(
    async (email: string): Promise<TurnkeyAuthInitResponse> => {
      setIsLoading(true);
      setError(null);
      setIsAuthenticating(true);

      try {
        if (!user?.userId) {
          throw new Error("User ID is required to initiate Turnkey login.");
        }
        debug(`Initiating login for: ${email}`);

        // Call FeathersJS service to initialize OTP
        const data: TurnkeyAuthInitResponse = await app.service("turnkey-auth").init({ email, userId: user.userId });

        debug(`OTP initialized successfully. OtpId: ${data.otpId}`);

        return data;
      } catch (err: any) {
        debug("Error initiating login:", err);
        const errorMessage = err.message || "Failed to send OTP email. Please try again.";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
        setIsAuthenticating(false);
      }
    },
    [user, setIsAuthenticating],
  );

  /**
   * Step 2: Verify OTP and authenticate
   * - Verifies OTP with backend
   * - Gets Turnkey session JWT
   * - Authenticates with b3-api using "turnkey-jwt" strategy
   * - JWT automatically stored in cookies by SDK
   */
  const verifyOtp = useCallback(
    async (otpId: string, otpCode: string): Promise<{ user: any }> => {
      setIsLoading(true);
      setError(null);
      setIsAuthenticating(true);

      try {
        debug(`Verifying OTP...`, { userId: user?.userId });

        // Step 1: Verify OTP and get Turnkey session JWT
        const { turnkeySessionJwt }: TurnkeyVerifyResponse = await app.service("turnkey-auth").verify({
          otpId,
          otpCode,
        });

        debug(`OTP verified! Authenticating with b3-api...`);

        // Step 2: Authenticate with b3-api using Turnkey JWT
        // The SDK will automatically store the b3-api JWT in cookies
        const authResult = await app.authenticate({
          strategy: "turnkey-jwt",
          accessToken: turnkeySessionJwt,
        } as any);

        debug(`Successfully authenticated with b3-api!`, authResult);

        // Update auth store to reflect authenticated state
        setIsAuthenticated(true);

        // Return user data
        return {
          user: authResult.user,
        };
      } catch (err: any) {
        debug("Error verifying OTP:", err);
        const errorMessage = err.message || "Failed to verify OTP. Please try again.";
        setError(errorMessage);
        setIsAuthenticated(false);
        throw err;
      } finally {
        setIsLoading(false);
        setIsAuthenticating(false);
      }
    },
    [user, setIsAuthenticating, setIsAuthenticated],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    initiateLogin,
    verifyOtp,
    isLoading,
    error,
    clearError,
  };
}
