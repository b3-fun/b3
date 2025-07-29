"use client";

import { ALL_CHAINS, getChainName, RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ShinyButton, useAccountWallet, useProfile } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { motion } from "framer-motion";
import { CheckIcon, ChevronRight, Loader2, Minus, RefreshCcw } from "lucide-react";
import { useMemo } from "react";
import { b3 } from "viem/chains";

interface ConnectWalletPaymentProps {
  order: components["schemas"]["Order"];
  onPayment: () => void;
  onCancel: () => void;
  txLoading: boolean;
  isSwitchingOrExecuting: boolean;
  phantomWalletAddress?: string | null;
}

function roundTokenAmount(amount: string | undefined): string | undefined {
  if (!amount) {
    return undefined;
  }

  // Split the number into whole and decimal parts
  const parts = amount.split(".");
  if (parts.length === 1) {
    // No decimal part
    return amount;
  }

  const wholePart = parts[0];
  const decimalPart = parts[1];

  // Check if decimal has 6 or fewer significant digits
  if (decimalPart.length <= 6) {
    return amount;
  }

  // Find the position of the first non-zero digit in the decimal part
  let firstNonZeroPos = 0;
  while (firstNonZeroPos < decimalPart.length && decimalPart[firstNonZeroPos] === "0") {
    firstNonZeroPos++;
  }

  // Calculate how many significant digits we have after the first non-zero
  const significantDigitsAfterFirstNonZero = decimalPart.length - firstNonZeroPos;

  // If we have 6 or fewer significant digits, return as is
  if (significantDigitsAfterFirstNonZero <= 6) {
    return amount;
  }

  // We need to round to 6 significant digits after the first non-zero
  // Keep all leading zeros plus 6 significant digits
  const keepLength = firstNonZeroPos + 6;

  // Always round up if there are more digits
  const shouldRoundUp = decimalPart.length > keepLength;

  // Create array of digits we're keeping (to handle carry)
  const digits = decimalPart.substring(0, keepLength).split("");

  // Apply rounding (always round up)
  if (shouldRoundUp) {
    // Start from the last position and carry as needed
    let i = digits.length - 1;
    let carry = 1;

    while (i >= 0 && carry > 0) {
      const digit = parseInt(digits[i], 10) + carry;
      if (digit === 10) {
        digits[i] = "0";
        carry = 1;
      } else {
        digits[i] = digit.toString();
        carry = 0;
      }
      i--;
    }

    // Handle carry into the whole part if needed
    if (carry > 0) {
      return `${(parseInt(wholePart, 10) + 1).toString()}.${digits.join("")}`;
    }
  }

  // Join the parts back together
  const roundedDecimalPart = digits.join("");
  return `${wholePart}.${roundedDecimalPart}`;
}

export default function ConnectWalletPayment({
  order,
  onPayment,
  onCancel,
  txLoading,
  isSwitchingOrExecuting,
  phantomWalletAddress,
}: ConnectWalletPaymentProps) {
  const account = useAccountWallet();
  const profile = useProfile({ address: order.recipientAddress });
  const recipientName = profile.data?.name?.replace(/\.b3\.fun/g, "");

  const srcToken = order.metadata.srcToken;
  const dstToken = order.metadata.dstToken;

  const expectedDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? "0"
      : order.payload.expectedDstAmount.toString();
  const formattedExpectedDstAmount = formatTokenAmount(BigInt(expectedDstAmount), dstToken.decimals);

  const roundedUpSrcAmount = useMemo(() => {
    const formattedSrcAmount = srcToken
      ? formatTokenAmount(BigInt(order.srcAmount), srcToken.decimals, 21, false)
      : undefined;

    return roundTokenAmount(formattedSrcAmount);
  }, [order.srcAmount, srcToken]);

  if (!srcToken || !dstToken) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Step Progress Indicator */}
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-as-brand/20 border-as-brand flex h-12 w-12 items-center justify-center rounded-full border-2"
        >
          <CheckIcon className="text-as-brand h-6 w-6" />
        </motion.div>

        <div className="border-as-primary/30 h-px w-8 border-t border-dotted"></div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-as-brand flex h-12 w-12 items-center justify-center rounded-full"
        >
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </motion.div>

        <div className="border-as-primary/30 h-px w-8 border-t border-dotted"></div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-as-primary/10 border-as-primary/30 flex h-12 w-12 items-center justify-center rounded-full border-2"
        >
          <span className="text-as-primary/50 text-lg font-semibold">3</span>
        </motion.div>
      </div>

      {/* Step Description */}
      <div className="text-center">
        <h2 className="text-as-primary text-xl font-semibold">Step 2 in progress...</h2>
        <p className="text-as-primary/50 mt-1 text-sm">Step 2 description...</p>
      </div>

      {/* Order Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-as-on-surface border-as-primary/10 w-full rounded-xl border p-6"
      >
        {/* Recipient */}
        <div className="flex items-center justify-between py-3">
          <span className="text-as-primary/70 text-sm">Recipient</span>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
              <span className="text-xs text-white">🦊</span>
            </div>
            <span className="text-as-primary text-sm font-medium">
              {recipientName ? `${recipientName}` : `Wallet`} ({centerTruncate(order.recipientAddress, 4)})
            </span>
          </div>
        </div>

        <div className="border-as-primary/10 my-2 border-t"></div>

        {/* Expected to Receive */}
        <div className="flex items-center justify-between py-3">
          <span className="text-as-primary/70 text-sm">Expected to receive</span>
          <div className="flex items-center gap-2">
            <span className="text-as-primary text-sm font-medium">
              {order.type === "swap" ? `${formattedExpectedDstAmount} ${dstToken.symbol}` : "NFT"}
            </span>
            <span className="text-as-primary/50 text-xs">on {getChainName(order.dstChain)}</span>
            <img
              src={ALL_CHAINS[order.dstChain].logoUrl}
              alt={getChainName(order.dstChain)}
              className={cn("h-4 w-4 rounded-full", order.dstChain === b3.id && "h-4 rounded-none")}
            />
            <Minus className="text-as-brand h-4 w-4" />
          </div>
        </div>

        <div className="border-as-primary/10 my-2 border-t"></div>

        {/* Status */}
        <div className="flex items-center justify-between py-3">
          <span className="text-as-primary/70 text-sm">Status</span>
          <span className="text-as-primary text-sm font-medium">Processing</span>
        </div>
      </motion.div>

      {/* Payment Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex w-full flex-col items-center gap-2"
      >
        <ShinyButton
          accentColor={"hsl(var(--as-brand))"}
          textColor="text-white"
          className="flex w-5/6 items-center gap-2 sm:px-0"
          disabled={txLoading || isSwitchingOrExecuting}
          onClick={onPayment}
        >
          {txLoading ? (
            <>
              Transaction Pending
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            </>
          ) : (
            <>
              <span className="pl-4 text-lg md:text-sm">
                {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
                  ? "Pay from Phantom Wallet"
                  : "Pay from Connected Wallet"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </ShinyButton>
        <span className="label-style text-as-primary/50 text-xs">
          Connected to:{" "}
          {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
            ? centerTruncate(phantomWalletAddress, 6)
            : centerTruncate(account?.address || "", 6)}
        </span>
      </motion.div>

      {/* Cancel Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-as-on-surface-2 text-as-secondary flex w-full items-center justify-center gap-2 rounded-lg p-3"
        onClick={onCancel}
      >
        <RefreshCcw className="h-4 w-4" />
        Cancel and start over
      </motion.button>
    </div>
  );
}
