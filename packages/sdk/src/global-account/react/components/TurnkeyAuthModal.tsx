import React, { useEffect, useRef, useState } from "react";
import { useTurnkeyAuth } from "../hooks/useTurnkeyAuth";

type ModalStep = "method" | "email" | "wallet" | "otp" | "success";

interface WalletProvider {
  name: string;
  icon?: string;
  address: string;
  chain: string;
}

interface TurnkeyAuthModalProps {
  onClose: () => void;
  onSuccess: (_user: any) => void;
  initialEmail?: string;
  skipToOtp?: boolean;
  enableWalletAuth?: boolean; // New prop to enable wallet authentication
}

export function TurnkeyAuthModal({
  onClose,
  onSuccess,
  initialEmail = "",
  skipToOtp = false,
  enableWalletAuth = false,
}: TurnkeyAuthModalProps) {
  const [step, setStep] = useState<ModalStep>(skipToOtp ? "otp" : enableWalletAuth ? "method" : "email");
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [otpId, setOtpId] = useState("");
  const [walletProviders, setWalletProviders] = useState<WalletProvider[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
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
      autoSubmitTriggeredRef.current = true;
      // Call initiateLogin directly to get OTP
      initiateLogin(email)
        .then(result => {
          setOtpId(result.otpId);
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
      setStep("otp");
    } catch (err) {
      // Error is handled by the hook
      console.error("Failed to initiate login:", err);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await verifyOtp(otpId, otpCode);
      setStep("success");

      // Auto-close after success and notify parent
      setTimeout(() => {
        onSuccess(result.user);
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

  // Fetch available wallet providers when wallet step is shown
  const fetchWallets = async () => {
    try {
      setWalletError(null);
      // Check if user has MetaMask or other injected wallets
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });

        if (accounts && accounts.length > 0) {
          setWalletProviders([
            {
              name: ethereum.isMetaMask ? "MetaMask" : "Ethereum Wallet",
              address: accounts[0],
              chain: "ethereum",
            },
          ]);
        } else {
          setWalletError("No wallet accounts found. Please connect your wallet.");
        }
      } else {
        setWalletError("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.");
      }
    } catch (err: any) {
      console.error("Failed to fetch wallets:", err);
      setWalletError(err.message || "Failed to connect to wallet");
    }
  };

  // Handle wallet authentication
  const handleWalletAuth = async (provider: WalletProvider) => {
    try {
      setWalletError(null);
      setSelectedWallet(provider);

      // For now, we'll need to implement the actual Turnkey wallet auth
      // This would involve signing a message with the wallet and sending it to the backend
      // TODO: Implement full wallet authentication flow with Turnkey
      setWalletError("Wallet authentication coming soon. Please use email authentication for now.");
    } catch (err: any) {
      console.error("Failed to authenticate with wallet:", err);
      setWalletError(err.message || "Failed to authenticate with wallet");
    }
  };

  const isTurnkeyPrimary = process.env.NEXT_PUBLIC_TURNKEY_PRIMARY === "true";
  const walletBrand = isTurnkeyPrimary ? "Smart Wallet" : "AnySpend Wallet";

  return (
    <div className="font-neue-montreal p-8">
      {/* Method Selection Step */}
      {step === "method" && (
        <>
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Setup your {walletBrand}
          </h2>
          <div className="mb-6 space-y-3 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Choose your authentication method</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStep("email")}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-6 py-4 font-semibold text-gray-900 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-blue-500 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email + OTP
              </div>
            </button>

            <button
              onClick={() => {
                setStep("wallet");
                fetchWallets();
              }}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-6 py-4 font-semibold text-gray-900 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-blue-500 dark:hover:bg-gray-700"
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                External Wallet
              </div>
            </button>
          </div>
        </>
      )}

      {/* Wallet Selection Step */}
      {step === "wallet" && (
        <>
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">Connect Wallet</h2>
          <div className="mb-6 space-y-3 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Select a wallet to authenticate</p>
          </div>

          {walletError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {walletError}
            </div>
          )}

          <div className="space-y-3">
            {walletProviders.length > 0 ? (
              walletProviders.map((provider, index) => (
                <button
                  key={index}
                  onClick={() => handleWalletAuth(provider)}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-6 py-4 font-semibold text-gray-900 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-blue-500 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {provider.icon && <img src={provider.icon} alt={provider.name} className="h-8 w-8" />}
                      <div className="text-left">
                        <div className="font-semibold">{provider.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {provider.address.slice(0, 6)}...{provider.address.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep("method")}
            className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to methods
          </button>
        </>
      )}

      {/* Email Step */}
      {step === "email" && (
        <>
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Setup your {walletBrand}
          </h2>
          <div className="mb-6 space-y-3 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              {isTurnkeyPrimary ? "We use a secure," : "AnySpend uses a secure,"}
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

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

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

          {enableWalletAuth && (
            <button
              onClick={() => setStep("method")}
              className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to methods
            </button>
          )}
        </>
      )}

      {/* OTP Step */}
      {step === "otp" && (
        <>
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">2FA Security</h2>
          <div className="mb-6 space-y-3 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              {isTurnkeyPrimary ? "We use a secure," : "AnySpend uses a secure,"}
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

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

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
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Successfully Authenticated!</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      )}
    </div>
  );
}
