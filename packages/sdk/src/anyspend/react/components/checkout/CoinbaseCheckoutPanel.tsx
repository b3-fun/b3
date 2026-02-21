"use client";

import { useAnyspendCreateOnrampOrder, useGeoOnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { TextShimmer, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

/** Map chain IDs to Coinbase blockchain identifiers */
const CHAIN_ID_TO_COINBASE_BLOCKCHAIN: Record<number, string> = {
  1: "ethereum",
  8453: "base",
  42161: "arbitrum",
  10: "optimism",
  137: "polygon",
  43114: "avalanche",
  56: "bsc",
};

interface CoinbaseCheckoutPanelProps {
  recipientAddress: string;
  destinationTokenAddress: string;
  destinationTokenChainId: number;
  totalAmount: string;
  themeColor?: string;
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onError?: (error: Error) => void;
  callbackMetadata?: Record<string, unknown>;
  classes?: AnySpendCheckoutClasses;
}

export function CoinbaseCheckoutPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  themeColor,
  onSuccess,
  onError,
  callbackMetadata,
}: CoinbaseCheckoutPanelProps) {
  const { data: tokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);

  const formattedAmount = useMemo(() => {
    const decimals = tokenData?.decimals || 18;
    return formatTokenAmount(BigInt(totalAmount), decimals);
  }, [totalAmount, tokenData]);

  const { geoData, coinbaseAvailablePaymentMethods, isLoading } = useGeoOnrampOptions(formattedAmount);

  // Order + redirect state
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderCreatedRef = useRef(false);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOnrampOrder({
    onSuccess: (data: any) => {
      const id = data?.data?.id;
      if (id) {
        setOrderId(id);
      } else {
        setError("Failed to create Coinbase order. Please try again.");
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create payment order.");
      onError?.(err);
    },
  });

  // Once we have orderId, generate Coinbase onramp URL and redirect
  useEffect(() => {
    if (!orderId || isRedirecting) return;

    const blockchain = CHAIN_ID_TO_COINBASE_BLOCKCHAIN[destinationTokenChainId];
    if (!blockchain) {
      setError(`Coinbase Pay is not supported for this chain.`);
      return;
    }

    const paymentMethodId = coinbaseAvailablePaymentMethods[0]?.id || "CARD";

    setIsRedirecting(true);

    anyspendService
      .getCoinbaseOnrampUrl({
        presetFiatAmount: formattedAmount,
        fiatCurrency: "USD",
        defaultAsset: tokenData?.symbol || "USDC",
        defaultPaymentMethod: paymentMethodId,
        destinationAddress: recipientAddress,
        blockchains: [blockchain],
        country: geoData?.country || "US",
        orderId,
        redirectUrl: window.location.href,
        useSessionToken: false,
      })
      .then((response) => {
        if (response.data?.url) {
          // Call onSuccess before redirecting so the parent knows the order was created
          onSuccess?.({ orderId });
          window.location.href = response.data.url;
        } else {
          setError("Failed to generate Coinbase Pay URL.");
          setIsRedirecting(false);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to generate Coinbase Pay URL.");
        setIsRedirecting(false);
        onError?.(err instanceof Error ? err : new Error(err.message));
      });
  }, [
    orderId,
    isRedirecting,
    destinationTokenChainId,
    coinbaseAvailablePaymentMethods,
    formattedAmount,
    tokenData,
    recipientAddress,
    geoData,
    onSuccess,
    onError,
  ]);

  const handleContinue = useCallback(() => {
    if (isCreatingOrder || orderCreatedRef.current) return;

    setError(null);
    orderCreatedRef.current = true;

    const dstToken = {
      address: destinationTokenAddress,
      chainId: destinationTokenChainId,
      decimals: tokenData?.decimals || 18,
      symbol: tokenData?.symbol || "",
      name: tokenData?.name || "",
      metadata: { logoURI: tokenData?.logoURI || "" },
    };

    const paymentMethodId = coinbaseAvailablePaymentMethods[0]?.id || "CARD";

    createOrder({
      recipientAddress,
      orderType: "swap",
      dstChain: destinationTokenChainId,
      dstToken,
      srcFiatAmount: formattedAmount,
      onramp: {
        vendor: "coinbase",
        paymentMethod: paymentMethodId,
        country: geoData?.country || "US",
        redirectUrl: window.location.href,
      },
      expectedDstAmount: totalAmount,
      callbackMetadata,
    });
  }, [
    isCreatingOrder,
    destinationTokenAddress,
    destinationTokenChainId,
    tokenData,
    coinbaseAvailablePaymentMethods,
    recipientAddress,
    formattedAmount,
    geoData,
    totalAmount,
    callbackMetadata,
    createOrder,
  ]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="anyspend-coinbase-loading flex items-center justify-center py-6"
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <TextShimmer duration={1.5} className="ml-2 text-sm">
          Checking availability...
        </TextShimmer>
      </motion.div>
    );
  }

  if (coinbaseAvailablePaymentMethods.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="anyspend-coinbase-unavailable py-4 text-center"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Coinbase Pay is not available in your region for this amount.
        </p>
      </motion.div>
    );
  }

  const isProcessing = isCreatingOrder || isRedirecting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="anyspend-coinbase-panel flex flex-col gap-3"
    >
      <p className="anyspend-coinbase-description text-sm text-gray-600 dark:text-gray-400">
        Pay with your Coinbase account using debit card, bank account, or crypto balance.
      </p>

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="coinbase-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (error) {
            // Reset state for retry
            setError(null);
            setOrderId(null);
            setIsRedirecting(false);
            orderCreatedRef.current = false;
          }
          handleContinue();
        }}
        disabled={isProcessing}
        className={cn(
          "anyspend-coinbase-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all",
          isProcessing
            ? "cursor-not-allowed bg-[#0052FF]/70"
            : "bg-[#0052FF] hover:bg-[#003ECF] active:scale-[0.98]",
        )}
        style={themeColor && !isProcessing ? { backgroundColor: themeColor } : undefined}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isRedirecting ? "Redirecting to Coinbase..." : "Creating order..."}
          </>
        ) : error ? (
          "Try again"
        ) : (
          "Continue with Coinbase"
        )}
      </button>
    </motion.div>
  );
}
