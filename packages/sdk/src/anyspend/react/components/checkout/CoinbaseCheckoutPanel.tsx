"use client";

import { useGeoOnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { TextShimmer, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

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
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount,
  themeColor,
}: CoinbaseCheckoutPanelProps) {
  const { data: tokenData } = useTokenData(destinationTokenChainId, destinationTokenAddress);

  const formattedAmount = useMemo(() => {
    const decimals = tokenData?.decimals || 18;
    return formatTokenAmount(BigInt(totalAmount), decimals);
  }, [totalAmount, tokenData]);

  const { coinbaseAvailablePaymentMethods, isLoading } = useGeoOnrampOptions(formattedAmount);

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
      <button
        className={cn(
          "anyspend-coinbase-btn w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all",
          "bg-[#0052FF] hover:bg-[#003ECF] active:scale-[0.98]",
        )}
        style={themeColor ? { backgroundColor: themeColor } : undefined}
      >
        Continue with Coinbase
      </button>
    </motion.div>
  );
}
