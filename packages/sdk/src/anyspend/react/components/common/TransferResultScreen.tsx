"use client";

import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { Home } from "lucide-react";
import { AnimatedCheckmark } from "../icons/AnimatedCheckmark";
import { TransferResult } from "../../hooks/useWatchTransfer";
import { ChainTokenIcon } from "./ChainTokenIcon";

export interface TransferResultScreenProps {
  mode?: "modal" | "page";
  /** The transfer result containing amount info */
  transferResult: TransferResult;
  /** The token that was transferred */
  token: components["schemas"]["Token"];
  /** The chain ID where the transfer happened */
  chainId: number;
  /** The recipient address */
  recipientAddress: string;
  /** Callback when back/close button is clicked */
  onBack?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
}

/**
 * A component for displaying the result of a pure transfer (same chain, same token).
 * Shows the transferred amount with success styling.
 */
export function TransferResultScreen({
  mode = "modal",
  transferResult,
  token,
  chainId,
  recipientAddress,
  onBack,
  onClose,
}: TransferResultScreenProps) {
  const chain = ALL_CHAINS[chainId];

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div
      className={cn(
        "anyspend-container anyspend-transfer-result font-inter bg-as-surface-primary mx-auto w-full max-w-[460px] p-6",
        mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
      )}
    >
      <div className="anyspend-transfer-result-content flex flex-col items-center gap-6">
        {/* Animated success checkmark */}
        <div className="anyspend-transfer-success-icon">
          <AnimatedCheckmark className="h-16 w-16" />
        </div>

        {/* Success message */}
        <div className="anyspend-transfer-success-message flex flex-col items-center gap-2">
          <h2 className="text-as-primary text-xl font-semibold">Transfer Received!</h2>
          <p className="text-as-secondary text-center text-sm">Your transfer has been successfully received.</p>
        </div>

        {/* Amount display */}
        <div className="anyspend-transfer-amount border-as-border-secondary bg-as-surface-secondary flex w-full flex-col items-center gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <ChainTokenIcon
              chainUrl={chain?.logoUrl}
              tokenUrl={token.metadata?.logoURI}
              className="h-10 min-h-10 w-10 min-w-10"
            />
            <div className="flex flex-col">
              <span className="text-as-primary text-2xl font-bold">
                {transferResult.formattedAmount} {token.symbol}
              </span>
              <span className="text-as-secondary text-sm">on {chain?.name ?? "Unknown Chain"}</span>
            </div>
          </div>
        </div>

        {/* Recipient info */}
        <div className="anyspend-transfer-recipient flex w-full flex-col gap-1">
          <span className="text-as-secondary text-xs">Received at</span>
          <span className="text-as-primary break-all font-mono text-sm">{recipientAddress}</span>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="anyspend-transfer-close-button bg-as-brand flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-medium text-white transition-all hover:opacity-90"
        >
          {mode === "page" ? (
            <>
              Return to Home <Home className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Close"
          )}
        </button>
      </div>
    </div>
  );
}
