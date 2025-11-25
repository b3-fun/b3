import React, { useState, useEffect, useRef } from "react";
import { useTurnkeyAuth } from "../hooks/useTurnkeyAuth";

type ModalStep = "email" | "otp" | "success";

interface TurnkeyAuthModalProps {
  onClose: () => void;
  onSuccess: (_user: any, _walletAddresses: string[]) => void;
  initialEmail?: string;
  skipToOtp?: boolean;
}

export function TurnkeyAuthModal({ onClose, onSuccess, initialEmail = "", skipToOtp = false }: TurnkeyAuthModalProps) {
  const [step, setStep] = useState<ModalStep>(skipToOtp ? "otp" : "email");
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [otpId, setOtpId] = useState("");
  const [subOrgId, setSubOrgId] = useState("");
  const [turnkeyAddresses, setTurnkeyAddresses] = useState<string[]>([]);
  const autoSubmitTriggeredRef = useRef(false);

  const { initiateLogin, verifyOtp, isLoading, error, clearError } = useTurnkeyAuth();

  // Update email when initialEmail changes
  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
    }
  }, [initialEmail, email]);

  // Auto-submit email form if skipToOtp is true - triggers on mount when skipToOtp=true
  useEffect(() => {
    if (skipToOtp && email && step === "otp" && !otpId && !isLoading && !autoSubmitTriggeredRef.current) {
      console.log("[TurnkeyAuthModal] Auto-submitting email to get OTP", { email, skipToOtp });
      autoSubmitTriggeredRef.current = true;
      // Call initiateLogin directly to get OTP
      initiateLogin(email)
        .then(result => {
          setOtpId(result.otpId);
          setSubOrgId(result.subOrgId);
          setTurnkeyAddresses(result.turnkeyAddresses);
        })
        .catch(err => {
          console.error("Failed to initiate login:", err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipToOtp, email, step, otpId, isLoading]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await initiateLogin(email);
      setOtpId(result.otpId);
      setSubOrgId(result.subOrgId);
      setTurnkeyAddresses(result.turnkeyAddresses);
      setStep("otp");
    } catch (err) {
      // Error is handled by the hook
      console.error("Failed to initiate login:", err);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await verifyOtp(otpId, otpCode, email, subOrgId);
      setStep("success");

      // Auto-close after success and notify parent
      setTimeout(() => {
        onSuccess(result.user, turnkeyAddresses);
        handleClose();
      }, 1500);
    } catch (err) {
      // Error is handled by the hook
      console.error("Failed to verify OTP:", err);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep("email");
    setEmail("");
    setOtpCode("");
    setOtpId("");
    setSubOrgId("");
    setTurnkeyAddresses([]);
    autoSubmitTriggeredRef.current = false;
    clearError();
    onClose();
  };

  const handleResendOtp = async () => {
    try {
      const result = await initiateLogin(email);
      setOtpId(result.otpId);
      clearError();
    } catch (err) {
      console.error("Failed to resend OTP:", err);
    }
  };

  return (
    <div className="font-neue-montreal p-8">
      {/* Email Step */}
      {step === "email" && (
        <>
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Setup your AnySpend Wallet
          </h2>
          <div className="mb-6 space-y-3 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              AnySpend uses a secure,
              <br />
              embedded wallet to fund your workflows.
            </p>
            <p>
              Please provide an email address to secure
              <br />
              your wallet.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Sending...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </>
      )}

      {/* OTP Step */}
      {step === "otp" && (
        <>
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
            2FA Security
          </h2>
          <div className="mb-6 space-y-3 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              AnySpend uses a secure,
              <br />
              embedded wallet to fund your workflows.
              <br />
              Please provide 2FA code sent to your email.
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter code"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.toUpperCase())}
                required
                disabled={isLoading}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-lg uppercase tracking-wider text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                maxLength={20}
              />
            </div>

            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading || !otpCode}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Resend code
              </button>
            </div>
          </form>
        </>
      )}

      {/* Success Step */}
      {step === "success" && (
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Successfully Authenticated!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      )}
    </div>
  );
}
