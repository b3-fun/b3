"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { CreditCard, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";
import { CheckoutSuccess } from "./CheckoutSuccess";
import { CoinbaseCheckoutPanel } from "./CoinbaseCheckoutPanel";
import { CryptoPayPanel } from "./CryptoPayPanel";
import { FiatCheckoutPanel } from "./FiatCheckoutPanel";

export type PaymentMethod = "crypto" | "card" | "coinbase";

interface CheckoutPaymentPanelProps {
  recipientAddress: string;
  destinationTokenAddress: string;
  destinationTokenChainId: number;
  totalAmount: string;
  buttonText?: string;
  themeColor?: string;
  returnUrl?: string;
  returnLabel?: string;
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onError?: (error: Error) => void;
  callbackMetadata?: Record<string, unknown>;
  classes?: AnySpendCheckoutClasses;
  /** Which payment method to expand initially. Defaults to none (all collapsed). */
  defaultPaymentMethod?: PaymentMethod;
  /** Optional sender (payer) address — pre-fills token balances in the crypto panel */
  senderAddress?: string;
}

function RadioCircle({ selected, themeColor }: { selected: boolean; themeColor?: string }) {
  return (
    <div
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-blue-600" : "border-gray-300 dark:border-gray-600",
      )}
      style={selected && themeColor ? { borderColor: themeColor } : undefined}
    >
      {selected && (
        <div
          className="h-2 w-2 rounded-full bg-blue-600"
          style={themeColor ? { backgroundColor: themeColor } : undefined}
        />
      )}
    </div>
  );
}

/** Card brand logos - all use consistent 32x20 viewBox */
function VisaLogo() {
  return (
    <svg viewBox="0 0 32 20" style={{ width: 32, height: 20 }} aria-label="Visa">
      <rect width="32" height="20" rx="3" fill="#1A1F71" />
      <text
        x="16"
        y="13.5"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="bold"
        fontFamily="sans-serif"
        fontStyle="italic"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 32 20" style={{ width: 32, height: 20 }} aria-label="Mastercard">
      <rect width="32" height="20" rx="3" fill="#252525" />
      <circle cx="12.5" cy="10" r="6" fill="#EB001B" />
      <circle cx="19.5" cy="10" r="6" fill="#F79E1B" />
      <path d="M16 5.6a6 6 0 0 1 0 8.8 6 6 0 0 1 0-8.8z" fill="#FF5F00" />
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg viewBox="0 0 32 20" style={{ width: 32, height: 20 }} aria-label="Amex">
      <rect width="32" height="20" rx="3" fill="#006FCF" />
      <text x="16" y="13" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
        AMEX
      </text>
    </svg>
  );
}

/** Coinbase mark */
function CoinbaseLogo() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }} aria-label="Coinbase">
      <circle cx="12" cy="12" r="12" fill="#0052FF" />
      <path
        d="M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm-1.8 4.8h3.6c.33 0 .6.27.6.6v4.2c0 .33-.27.6-.6.6h-3.6a.6.6 0 0 1-.6-.6V9.9c0-.33.27-.6.6-.6z"
        fill="white"
      />
    </svg>
  );
}

export function CheckoutPaymentPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  buttonText,
  themeColor,
  returnUrl,
  returnLabel,
  onSuccess,
  onError,
  callbackMetadata,
  classes,
  defaultPaymentMethod,
  senderAddress,
}: CheckoutPaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(defaultPaymentMethod ?? null);
  const [paymentResult, setPaymentResult] = useState<{ txHash?: string; orderId?: string } | null>(null);

  const handleSuccess = (result: { txHash?: string; orderId?: string }) => {
    setPaymentResult(result);
    onSuccess?.(result);
  };

  if (paymentResult) {
    return (
      <CheckoutSuccess
        txHash={paymentResult.txHash}
        orderId={paymentResult.orderId}
        returnUrl={returnUrl}
        returnLabel={returnLabel}
        classes={classes}
      />
    );
  }

  const accordionButtonClass = (active: boolean) =>
    cn(
      "anyspend-payment-method-btn flex w-full items-center gap-3 px-4 py-4 text-left transition-colors",
      active ? "bg-white dark:bg-gray-900" : "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800",
      classes?.paymentMethodButton,
    );

  const expandedPanelClass = cn(
    "anyspend-payment-method-panel border-t border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900",
  );

  return (
    <div className={cn("anyspend-payment-panel flex flex-col gap-5", classes?.paymentPanel)}>
      <h2
        className={cn(
          "anyspend-payment-title text-lg font-semibold text-gray-900 dark:text-gray-100",
          classes?.paymentTitle,
        )}
      >
        Payment
      </h2>

      {/* Accordion-style payment methods */}
      <div
        className={cn(
          "anyspend-payment-methods divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700",
          classes?.paymentMethodSelector,
        )}
      >
        {/* Pay with crypto */}
        <div className="anyspend-method-crypto">
          <button
            onClick={() => setPaymentMethod(paymentMethod === "crypto" ? null : "crypto")}
            className={accordionButtonClass(paymentMethod === "crypto")}
          >
            <RadioCircle selected={paymentMethod === "crypto"} themeColor={themeColor} />
            <Wallet className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Pay with crypto</span>
          </button>
          <AnimatePresence initial={false}>
            {paymentMethod === "crypto" && (
              <motion.div
                key="crypto-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className={expandedPanelClass}>
                  <CryptoPayPanel
                    recipientAddress={recipientAddress}
                    destinationTokenAddress={destinationTokenAddress}
                    destinationTokenChainId={destinationTokenChainId}
                    totalAmount={totalAmount}
                    buttonText={buttonText}
                    themeColor={themeColor}
                    onSuccess={handleSuccess}
                    onError={onError}
                    callbackMetadata={callbackMetadata}
                    classes={classes}
                    senderAddress={senderAddress}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Credit or Debit Card */}
        <div className="anyspend-method-card">
          <button onClick={() => setPaymentMethod(paymentMethod === "card" ? null : "card")} className={accordionButtonClass(paymentMethod === "card")}>
            <RadioCircle selected={paymentMethod === "card"} themeColor={themeColor} />
            <CreditCard className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Credit or debit card</span>
            <div className="ml-auto flex items-center gap-1">
              <VisaLogo />
              <MastercardLogo />
              <AmexLogo />
            </div>
          </button>
          <AnimatePresence initial={false}>
            {paymentMethod === "card" && (
              <motion.div
                key="card-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className={expandedPanelClass}>
                  <FiatCheckoutPanel
                    recipientAddress={recipientAddress}
                    destinationTokenAddress={destinationTokenAddress}
                    destinationTokenChainId={destinationTokenChainId}
                    totalAmount={totalAmount}
                    themeColor={themeColor}
                    onSuccess={handleSuccess}
                    onError={onError}
                    callbackMetadata={callbackMetadata}
                    classes={classes}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Coinbase Pay */}
        <div className="anyspend-method-coinbase">
          <button
            onClick={() => setPaymentMethod(paymentMethod === "coinbase" ? null : "coinbase")}
            className={accordionButtonClass(paymentMethod === "coinbase")}
          >
            <RadioCircle selected={paymentMethod === "coinbase"} themeColor={themeColor} />
            <CoinbaseLogo />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Coinbase Pay</span>
          </button>
          <AnimatePresence initial={false}>
            {paymentMethod === "coinbase" && (
              <motion.div
                key="coinbase-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className={expandedPanelClass}>
                  <CoinbaseCheckoutPanel
                    recipientAddress={recipientAddress}
                    destinationTokenAddress={destinationTokenAddress}
                    destinationTokenChainId={destinationTokenChainId}
                    totalAmount={totalAmount}
                    themeColor={themeColor}
                    onSuccess={handleSuccess}
                    onError={onError}
                    callbackMetadata={callbackMetadata}
                    classes={classes}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
