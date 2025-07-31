"use client";

import { RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ShinyButton, useAccountWallet, useProfile } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { motion } from "framer-motion";
import { CheckIcon, ChevronRight, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { OrderDetailsCollapsible } from "./OrderDetailsCollapsible";

type Tournament = components["schemas"]["Tournament"];
type NFT = components["schemas"]["NFT"];

interface ConnectWalletPaymentProps {
  order: components["schemas"]["Order"];
  onPayment: () => void;
  onCancel: () => void;
  txLoading: boolean;
  isSwitchingOrExecuting: boolean;
  phantomWalletAddress?: string | null;
  tournament?: Tournament;
  nft?: NFT;
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
  tournament,
  nft,
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
      <div className="flex items-center gap-1.5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-as-success-secondary flex h-10 w-10 items-center justify-center rounded-full"
        >
          <CheckIcon className="text-as-content-icon-success h-6 w-6" />
        </motion.div>

        <div className="border-as-primary/30 h-px w-8 border-t border-dotted"></div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-as-border-secondary relative flex h-10 w-10 items-center justify-center rounded-full border-[3px]"
        >
          <div className="border-t-as-primary absolute -inset-0.5 animate-spin rounded-full border-[3px] border-transparent" />
          <span className="text-as-primary font-semibold">2</span>
        </motion.div>

        <div className="border-as-primary/30 h-px w-8 border-t border-dotted"></div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-as-border-secondary flex h-10 w-10 items-center justify-center rounded-full border-[3px]"
        >
          <span className="text-as-content-disabled font-semibold">3</span>
        </motion.div>
      </div>

      {/* Step Description */}
      <div className="text-center">
        <h2 className="text-as-primary text-xl font-semibold">Step 2 in progress...</h2>
        <p className="text-as-primary/50 mt-1 text-sm">Step 2 description...</p>
      </div>

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
              <span className="whitespace-nowrap pl-4 text-lg md:text-sm">
                {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
                  ? "Pay from Phantom Wallet"
                  : "Pay from Connected Wallet"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </ShinyButton>

        <div className="mt-4">
          <OrderDetailsCollapsible
            order={order}
            dstToken={dstToken}
            tournament={tournament}
            nft={nft}
            recipientName={recipientName}
            formattedExpectedDstAmount={formattedExpectedDstAmount}
          />
        </div>
      </motion.div>
    </div>
  );
}
