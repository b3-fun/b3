"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { ShinyButton, TextShimmer, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Loader2, ShieldCheck, AlertTriangle, Clock, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConnectModal } from "thirdweb/react";
import { useAccount } from "wagmi";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";
import { useCreateKycInquiry, useKycStatus, useVerifyKyc } from "../../hooks/useKycStatus";

interface KycGateProps {
  themeColor?: string;
  classes?: AnySpendCheckoutClasses;
  /** Only fetch KYC status (and prompt wallet signature) when true. */
  enabled?: boolean;
  /** Called when KYC status is resolved (approved or not required) */
  onStatusResolved: (approved: boolean) => void;
}

export function KycGate({ themeColor, classes, enabled = false, onStatusResolved }: KycGateProps) {
  const { address } = useAccount();
  const { connect: openConnectModal } = useConnectModal();
  // Gate the status fetch behind explicit user consent so the wallet
  // signature prompt doesn't fire automatically on tab open.
  const [userInitiated, setUserInitiated] = useState(false);
  const { kycStatus, isLoadingKycStatus, refetchKycStatus } = useKycStatus(enabled && userInitiated);
  const { createInquiry, isCreatingInquiry } = useCreateKycInquiry();
  const { verifyKyc, isVerifying } = useVerifyKyc();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setClosable = useModalStore(state => state.setClosable);

  const [personaOpen, setPersonaOpen] = useState(false);
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [personaCancelled, setPersonaCancelled] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  // Notify parent when status resolves
  useEffect(() => {
    if (!kycStatus) return;

    const currentStatus = kycStatus.status;
    if (currentStatus === prevStatusRef.current) return;
    prevStatusRef.current = currentStatus;

    if (!kycStatus.kycRequired || currentStatus === "approved") {
      onStatusResolved(true);
    }
  }, [kycStatus, onStatusResolved]);

  const openPersonaFlow = useCallback(
    async (config: { inquiryId: string; sessionToken: string; environment?: string }) => {
      setPersonaOpen(true);
      try {
        // Dynamic import to keep bundle small
        const { Client } = await import("persona");
        const client = new Client({
          inquiryId: config.inquiryId,
          sessionToken: config.sessionToken,
          environment: config.environment === "production" ? "production" : "sandbox",
          onComplete: async ({ inquiryId }) => {
            // Reopen the modal first so the user lands back in the checkout flow
            setB3ModalOpen(true);
            setPersonaOpen(false);
            if (inquiryId) {
              try {
                const result = await verifyKyc(inquiryId);
                if (result.status === "approved") {
                  onStatusResolved(true);
                }
              } catch (err) {
                setPersonaError(err instanceof Error ? err.message : "Verification check failed — please retry.");
              }
            }
            refetchKycStatus();
          },
          onCancel: () => {
            // Reopen the modal so the user can retry or cancel the purchase
            setB3ModalOpen(true);
            setPersonaOpen(false);
            setPersonaCancelled(true);
          },
          onError: error => {
            // Reopen the modal so the user sees the error and can retry
            setB3ModalOpen(true);
            setPersonaOpen(false);
            setPersonaError(error?.message || "Verification encountered an error");
          },
        });
        // Close the modal before opening Persona so its overlay is fully
        // interactive — no Radix Dialog backdrop or z-index conflicts.
        // The modal's contentType is preserved in Zustand and restored on reopen.
        setB3ModalOpen(false);
        client.open();
      } catch (error) {
        setPersonaOpen(false);
        setB3ModalOpen(true);
        setPersonaError("Failed to load verification module");
      }
    },
    [verifyKyc, onStatusResolved, refetchKycStatus, setB3ModalOpen],
  );

  const handleStartVerification = useCallback(async () => {
    setPersonaError(null);
    setPersonaCancelled(false);

    try {
      const { inquiryId, sessionToken } = await createInquiry();
      openPersonaFlow({
        inquiryId,
        sessionToken,
        environment: kycStatus?.config?.environment,
      });
    } catch (error) {
      setPersonaError(error instanceof Error ? error.message : "Failed to start verification");
    }
  }, [createInquiry, kycStatus, openPersonaFlow]);

  const handleConnectWallet = useCallback(async () => {
    setClosable(false);
    try {
      await openConnectModal({ client, size: "compact", showThirdwebBranding: false });
    } finally {
      setClosable(true);
      setB3ModalOpen(true);
    }
  }, [openConnectModal, setClosable, setB3ModalOpen]);

  const handleResumeVerification = useCallback(() => {
    if (!kycStatus?.inquiry) return;

    setPersonaError(null);
    setPersonaCancelled(false);

    openPersonaFlow({
      inquiryId: kycStatus.inquiry.inquiryId,
      sessionToken: kycStatus.inquiry.sessionToken,
      environment: kycStatus.config?.environment,
    });
  }, [kycStatus, openPersonaFlow]);

  // No wallet connected — prompt to connect wallet (same pattern as crypto tab)
  if (!address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("anyspend-kyc-auth flex flex-col items-center gap-4 py-2", classes?.fiatPanel)}
      >
        <ShieldCheck className="h-8 w-8 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Connect wallet to pay with card</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A wallet connection is required to complete identity verification.
          </p>
        </div>
        <ShinyButton
          accentColor={themeColor || "hsl(var(--as-brand))"}
          className="w-full"
          textClassName="text-white"
          onClick={handleConnectWallet}
        >
          <span className="flex items-center justify-center gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </span>
        </ShinyButton>
      </motion.div>
    );
  }

  // Wallet connected but user hasn't kicked off the KYC check yet
  if (!userInitiated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("anyspend-kyc-prompt flex flex-col items-center gap-4 py-2", classes?.fiatPanel)}
      >
        <ShieldCheck className="h-8 w-8 text-blue-500" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Identity verification required</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Card payments require a one-time identity check. This takes about 2 minutes.
          </p>
        </div>
        <ShinyButton
          accentColor={themeColor || "hsl(var(--as-brand))"}
          className="w-full"
          textClassName="text-white"
          onClick={() => setUserInitiated(true)}
        >
          <span className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Continue to Verify
          </span>
        </ShinyButton>
      </motion.div>
    );
  }

  // Loading KYC status state
  if (isLoadingKycStatus) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("anyspend-kyc-loading flex flex-col items-center gap-3 py-6", classes?.fiatPanel)}
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="text-sm">
          Checking verification status...
        </TextShimmer>
      </motion.div>
    );
  }

  // Not required or already approved — render nothing
  if (!kycStatus?.kycRequired || kycStatus.status === "approved") {
    return null;
  }

  // Persona flow is open - show loading
  if (personaOpen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("anyspend-kyc-persona flex flex-col items-center gap-3 py-6", classes?.fiatPanel)}
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="text-sm">
          Identity verification in progress...
        </TextShimmer>
        <p className="text-xs text-gray-400 dark:text-gray-500">Complete the verification in the popup window</p>
      </motion.div>
    );
  }

  // Needs review or completed (submitted, awaiting Persona decision)
  if (kycStatus.status === "needs_review" || kycStatus.status === "completed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("anyspend-kyc-review flex flex-col items-center gap-3 py-2", classes?.fiatPanel)}
      >
        <Clock className="h-8 w-8 text-amber-500" />
        <p className="text-center text-sm font-medium text-amber-700 dark:text-amber-300">
          Your verification is under review
        </p>
        <p className="text-center text-xs text-amber-600 dark:text-amber-400">
          This usually takes a few minutes. Please check back shortly.
        </p>
        <button
          onClick={() => refetchKycStatus()}
          className="mt-1 text-sm font-medium text-amber-700 underline hover:text-amber-800 dark:text-amber-300"
        >
          Check status
        </button>
      </motion.div>
    );
  }

  // Pending (started before) - offer resume
  if (kycStatus.status === "pending" && kycStatus.inquiry) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("anyspend-kyc-resume flex flex-col items-center gap-4 py-2", classes?.fiatPanel)}
      >
        <ShieldCheck className="h-8 w-8 text-blue-500" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Continue verification</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You have an incomplete verification. Resume to continue.
          </p>
        </div>
        <ShinyButton
          accentColor={themeColor || "hsl(var(--as-brand))"}
          className="w-full"
          textClassName="text-white"
          onClick={handleResumeVerification}
          disabled={isCreatingInquiry}
        >
          <span className="flex items-center justify-center gap-2">
            {isCreatingInquiry ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Resume Verification
          </span>
        </ShinyButton>
      </motion.div>
    );
  }

  // Not verified / declined / expired - show verification prompt
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("anyspend-kyc-prompt flex flex-col items-center gap-4 py-2", classes?.fiatPanel)}
    >
      <ShieldCheck className="h-8 w-8 text-blue-500" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Identity verification required</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Card payments require a one-time identity check. This takes about 2 minutes.
        </p>
      </div>

      <AnimatePresence initial={false}>
        {personaError && (
          <motion.div
            key="kyc-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20"
          >
            <p className="text-center text-sm text-red-600 dark:text-red-400">{personaError}</p>
          </motion.div>
        )}
        {personaCancelled && (
          <motion.div
            key="kyc-cancelled"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20"
          >
            <p className="text-center text-sm text-amber-600 dark:text-amber-400">
              Verification cancelled. Click below to try again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {kycStatus.status === "declined" && (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400">
            Previous verification was declined. You may try again.
          </p>
        </div>
      )}

      <ShinyButton
        accentColor={themeColor || "hsl(var(--as-brand))"}
        className="w-full"
        textClassName="text-white"
        onClick={handleStartVerification}
        disabled={isCreatingInquiry || isVerifying}
      >
        <span className="flex items-center justify-center gap-2">
          {isCreatingInquiry ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {isCreatingInquiry ? "Starting..." : "Verify Identity"}
        </span>
      </ShinyButton>
    </motion.div>
  );
}
