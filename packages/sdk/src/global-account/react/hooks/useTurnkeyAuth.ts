import { TurnkeyAuthInitResponse } from "@b3dotfun/b3-api";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback, useState } from "react";
import app from "../../app";
import { useB3Config } from "../components";
import { useAuthStore } from "../stores";
import { useAuth } from "./useAuth";

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
  const { authenticate } = useAuth();

  /**
   * Step 1: Initiate login with email
   * - Calls backend turnkey-jwt strategy (init action) to create sub-org (if needed) and send OTP
   * - Returns otpId to use in verification step
   *
   * Note: Uses the turnkey-jwt authentication strategy, not the service directly.
   * The turnkey-jwt strategy handles both OTP flow (init/verify) and final authentication.
   */
  const initiateLogin = useCallback(
    async (email: string): Promise<TurnkeyAuthInitResponse> => {
      setIsLoading(true);
      setError(null);
      setIsAuthenticating(true);

      try {
        debug(`Initiating login for: ${email}`);

        // Use authentication service with turnkey-jwt strategy (init action)
        // userId is resolved from authentication context on the backend (params.user.userId)
        // Backend will get userId from _params.user?.userId if authenticated, or handle unauthenticated case
        // So we only need to send email
        debug(`Calling app.authenticate with turnkey-jwt strategy (init action)`, { email });

        const response = await app.authenticate({
          strategy: "turnkey-jwt",
          action: "init",
          email,
        } as any);

        // The strategy returns the TurnkeyAuthInitResponse directly
        const data = response as unknown as TurnkeyAuthInitResponse;

        debug(`OTP initialized successfully. OtpId: ${data.otpId}`);

        return data;
      } catch (err: any) {
        debug("Error initiating login:", err);

        // Provide more detailed error information
        let errorMessage = "Failed to send OTP email. Please try again.";

        if (err.message) {
          errorMessage = err.message;
        } else if (err.name === "TypeError" && err.message?.includes("fetch")) {
          errorMessage = "Network error: Unable to reach the server. Please check your connection and try again.";
        } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
          errorMessage = "Connection error: Unable to reach the server. Please check your internet connection.";
        } else if (err.response) {
          // FeathersJS error response
          errorMessage = err.response.message || err.message || errorMessage;
          debug("FeathersJS error response:", err.response);
        }

        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
        setIsAuthenticating(false);
      }
    },
    [setIsAuthenticating],
  );

  /**
   * Step 2: Verify OTP and authenticate
   * - Verifies OTP with backend via turnkey-jwt strategy (verify action)
   * - Gets Turnkey session JWT from the verify response
   * - Authenticates with b3-api using "turnkey-jwt" strategy
   * - JWT automatically stored in cookies by SDK
   */
  const verifyOtp = useCallback(
    async (otpId: string, otpCode: string): Promise<{ user: any }> => {
      setIsLoading(true);
      setError(null);
      setIsAuthenticating(true);

      try {
        debug(`Verifying OTP...`, { otpId });

        // Step 1: Verify OTP with backend using turnkey-jwt strategy (verify action)
        // This returns the Turnkey session JWT
        const response = await app.authenticate({
          strategy: "turnkey-jwt",
          action: "verify",
          otpId,
          otpCode,
        } as any);

        // The strategy returns the TurnkeyAuthVerifyResponse directly
        const verifyResult = response as unknown as TurnkeyVerifyResponse;
        const { turnkeySessionJwt } = verifyResult;

        debug(`OTP verified! Got Turnkey session JWT. Authenticating with b3-api...`);

        // Step 2: Authenticate with b3-api using Turnkey JWT
        // Use the unified useAuth hook for authentication with "turnkey-jwt" strategy
        const authResult = await authenticate(turnkeySessionJwt, partnerId || "");

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
    [partnerId, setIsAuthenticating, setIsAuthenticated, authenticate],
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
