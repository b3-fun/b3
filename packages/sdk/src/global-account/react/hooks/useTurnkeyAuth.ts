import app from "../../app";
import { useAuthStore } from "../stores";
import { useState } from "react";
import { useB3 } from "../components/B3Provider/useB3";
import { TurnkeyAuthInitResponse } from "@b3dotfun/b3-api";

interface TurnkeyInitResponse {
  otpId: string;
  subOrgId: string;
  turnkeyAddresses: string[];
  requiresOtp: boolean;
  isNewUser: boolean;
}

interface TurnkeyVerifyResponse {
  turnkeySessionJwt: string;
}

interface UseTurnkeyAuthReturn {
  initiateLogin: (_email: string) => Promise<TurnkeyInitResponse>;
  verifyOtp: (_otpId: string, _otpCode: string, _email: string, _subOrgId: string) => Promise<{ user: any }>;
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
  const { user } = useB3();

  /**
   * Step 1: Initiate login with email
   * - Calls backend to create sub-org (if needed) and send OTP
   * - Returns otpId to use in verification step
   */
  const initiateLogin = async (email: string): Promise<TurnkeyAuthInitResponse> => {
    setIsLoading(true);
    setError(null);
    setIsAuthenticating(true);

    try {
      if (!user?.userId) {
        throw new Error("User ID is required to initiate Turnkey login.");
      }
      console.log(`[useTurnkeyAuth] Initiating login for: ${email}`);

      // Call FeathersJS service to initialize OTP
      const data: TurnkeyAuthInitResponse = await app.service("turnkey-auth").init({ email, userId: user.userId });

      console.log(`[useTurnkeyAuth] OTP initialized successfully. OtpId: ${data.otpId}`);

      return data;
    } catch (err: any) {
      console.error("[useTurnkeyAuth] Error initiating login:", err);
      const errorMessage = err.message || "Failed to send OTP email. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
      setIsAuthenticating(false);
    }
  };

  /**
   * Step 2: Verify OTP and authenticate
   * - Verifies OTP with backend
   * - Gets Turnkey session JWT
   * - Authenticates with b3-api using "turnkey-jwt" strategy
   * - JWT automatically stored in cookies by SDK
   */
  const verifyOtp = async (otpId: string, otpCode: string, email: string, subOrgId: string): Promise<{ user: any }> => {
    setIsLoading(true);
    setError(null);
    setIsAuthenticating(true);

    try {
      console.log(`[useTurnkeyAuth] Verifying OTP...`, { userId: user });

      // Step 1: Verify OTP and get Turnkey session JWT
      const { turnkeySessionJwt }: TurnkeyVerifyResponse = await app.service("turnkey-auth").verify({
        otpId,
        otpCode,
      });

      console.log(`[useTurnkeyAuth] OTP verified! Authenticating with b3-api...`);

      // Step 2: Authenticate with b3-api using Turnkey JWT
      // The SDK will automatically store the b3-api JWT in cookies
      const authResult = await app.authenticate({
        strategy: "turnkey-jwt",
        accessToken: turnkeySessionJwt,
      } as any);

      console.log(`[useTurnkeyAuth] Successfully authenticated with b3-api!`, authResult);

      // Update auth store to reflect authenticated state
      setIsAuthenticated(true);

      // Return user data
      return {
        user: authResult.user,
      };
    } catch (err: any) {
      console.error("[useTurnkeyAuth] Error verifying OTP:", err);
      const errorMessage = err.message || "Failed to verify OTP. Please try again.";
      setError(errorMessage);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
      setIsAuthenticating(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    initiateLogin,
    verifyOtp,
    isLoading,
    error,
    clearError,
  };
}
