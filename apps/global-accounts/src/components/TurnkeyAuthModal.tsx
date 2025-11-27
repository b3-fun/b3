import * as Dialog from "@radix-ui/react-dialog";
import React, { useState } from "react";
import { useTurnkeyAuth } from "../hooks/useTurnkeyAuth";

type ModalStep = "email" | "otp" | "success";

interface TurnkeyWalletAccount {
  walletAccountId: string;
  organizationId: string;
  walletId: string;
  curve: string;
  pathFormat: string;
  path: string;
  addressFormat: string;
  address: string;
  createdAt?: { seconds: string; nanos: number | string };
  updatedAt?: { seconds: string; nanos: number | string };
  publicKey?: string;
}

interface TurnkeySubOrg {
  subOrgId: string;
  accounts: TurnkeyWalletAccount[];
  hasDelegatedUser?: boolean;
}

interface TurnkeyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (_user: any, _walletAddresses: string[]) => void;
}

export function TurnkeyAuthModal({ isOpen, onClose, onSuccess }: TurnkeyAuthModalProps) {
  const [step, setStep] = useState<ModalStep>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpId, setOtpId] = useState("");
  const [subOrgId, setSubOrgId] = useState("");
  const [turnkeySubOrgs, setTurnkeySubOrgs] = useState<TurnkeySubOrg[]>([]);

  const { initiateLogin, verifyOtp, isLoading, error, clearError } = useTurnkeyAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await initiateLogin(email);
      setOtpId(result.otpId);
      setSubOrgId(result.subOrgId);
      setTurnkeySubOrgs(result.turnkeySubOrgs);
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
      // Extract all addresses from turnkeySubOrgs for backward compatibility
      const allAddresses = turnkeySubOrgs.flatMap(subOrg => subOrg.accounts.map(account => account.address));
      setTimeout(() => {
        onSuccess(result.user, allAddresses);
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
    setTurnkeySubOrgs([]);
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
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[5px]">
          <Dialog.Content className="font-neue-montreal w-[90%] max-w-[440px] rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            {/* Email Step */}
            {step === "email" && (
              <>
                <Dialog.Title className="mb-6 text-center text-2xl font-bold text-gray-900">
                  Login with Turnkey
                </Dialog.Title>
                <Dialog.Description className="mb-6 text-center text-sm text-gray-600">
                  Enter your email address to receive a verification code.
                </Dialog.Description>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>

                  {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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

                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="w-full rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <>
                <Dialog.Title className="mb-4 text-center text-2xl font-bold text-gray-900">
                  Enter Verification Code
                </Dialog.Title>
                <Dialog.Description className="mb-6 text-center text-sm text-gray-600">
                  We've sent a code to <strong>{email}</strong>
                </Dialog.Description>

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Enter code (e.g. XV5T1GBV4)"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.toUpperCase())}
                      required
                      disabled={isLoading}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-lg uppercase tracking-wider text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                      maxLength={20}
                    />
                  </div>

                  {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !otpCode}
                      className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Verifying...
                        </span>
                      ) : (
                        "Verify"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      Resend code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtpCode("");
                        clearError();
                      }}
                      disabled={isLoading}
                      className="text-sm text-gray-600 hover:text-gray-700 hover:underline disabled:cursor-not-allowed"
                    >
                      ← Back to email
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Success Step */}
            {step === "success" && (
              <div className="text-center">
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <Dialog.Title className="mb-2 text-2xl font-bold text-gray-900">
                  Successfully Authenticated!
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600">Redirecting...</Dialog.Description>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
