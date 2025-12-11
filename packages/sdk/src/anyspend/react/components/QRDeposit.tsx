import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import {
  NetworkArbitrumOne,
  NetworkBase,
  NetworkBinanceSmartChain,
  NetworkEthereum,
  NetworkOptimism,
  NetworkPolygonPos,
} from "@web3icons/react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { ChainConfig } from "./AnySpendDeposit";

export interface QRDepositProps {
  /** Display mode */
  mode?: "modal" | "page";
  /** The recipient/deposit address */
  recipientAddress: string;
  /** The destination token to receive */
  destinationToken: components["schemas"]["Token"];
  /** The destination chain ID */
  destinationChainId: number;
  /** List of supported chains */
  supportedChains: ChainConfig[];
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
}

// Chain icon component
function ChainIcon({ chainId, className }: { chainId: number; className?: string }) {
  const iconProps = { className: cn("h-5 w-5", className) };

  switch (chainId) {
    case 1:
      return <NetworkEthereum {...iconProps} />;
    case 8453:
      return <NetworkBase {...iconProps} />;
    case 137:
      return <NetworkPolygonPos {...iconProps} />;
    case 42161:
      return <NetworkArbitrumOne {...iconProps} />;
    case 10:
      return <NetworkOptimism {...iconProps} />;
    case 56:
      return <NetworkBinanceSmartChain {...iconProps} />;
    default:
      return null;
  }
}

/**
 * A component for displaying QR code deposit functionality.
 * Shows a QR code that can be scanned to deposit tokens directly.
 *
 * @example
 * <QRDeposit
 *   recipientAddress={userAddress}
 *   destinationToken={usdcToken}
 *   destinationChainId={8453}
 *   supportedChains={chains}
 *   onBack={() => setStep("select-chain")}
 * />
 */
export function QRDeposit({
  mode = "modal",
  recipientAddress,
  destinationToken,
  destinationChainId,
  supportedChains,
  onBack,
  onClose,
}: QRDepositProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (recipientAddress) {
      await navigator.clipboard.writeText(recipientAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    setCopied(false);
    onBack?.();
  };

  const handleClose = () => {
    setCopied(false);
    onClose?.();
  };

  return (
    <div
      className={cn(
        "anyspend-container font-inter bg-as-surface-primary mx-auto w-full max-w-[460px] p-6",
        mode === "page" && "border-as-border-secondary overflow-hidden rounded-2xl border shadow-xl",
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Header with back button and close button */}
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="text-as-secondary hover:text-as-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-as-primary text-base font-semibold">Deposit</h2>
          <div></div>
        </div>

        {/* Asset selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-as-secondary text-sm">Asset</label>
          <div className="border-as-stroke flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="flex items-center gap-2">
              {destinationToken.metadata?.logoURI && (
                <img
                  src={destinationToken.metadata.logoURI}
                  alt={destinationToken.symbol}
                  className="h-5 w-5 rounded-full"
                />
              )}
              <span className="text-as-primary text-sm font-medium">{destinationToken.symbol}</span>
            </div>
            <ChevronDown className="text-as-secondary h-4 w-4" />
          </div>
        </div>

        {/* Chain selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-as-secondary text-sm">Chain</label>
          <div className="border-as-stroke flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <ChainIcon chainId={destinationChainId} className="h-5 w-5" />
              <span className="text-as-primary text-sm font-medium">
                {supportedChains.find(c => c.id === destinationChainId)?.name ?? "Unknown"}
              </span>
            </div>
            <ChevronDown className="text-as-secondary h-4 w-4" />
          </div>
        </div>

        {/* QR Code and Address - horizontal layout */}
        <div className="border-as-stroke flex items-start gap-4 rounded-xl border p-4">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-lg bg-white p-2">
              <QRCodeSVG value={recipientAddress} size={120} level="M" marginSize={0} />
            </div>
            <span className="text-as-secondary text-xs">
              SCAN WITH <span className="inline-block">🦊</span>
            </span>
          </div>

          {/* Address info */}
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-as-secondary text-sm">Deposit address:</span>
            <div className="flex items-start gap-1">
              <span className="text-as-primary break-all font-mono text-sm leading-relaxed">{recipientAddress}</span>
              <button onClick={handleCopyAddress} className="text-as-secondary hover:text-as-primary mt-0.5 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <p className="text-center text-xs italic text-red-500">
          Do not send any tokens other than the ones specified.
          <br />
          Tokens not accepted will not be converted.
        </p>

        {/* Copy button */}
        <button
          onClick={handleCopyAddress}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 font-medium text-white transition-all hover:bg-blue-600"
        >
          Copy deposit address
        </button>
      </div>
    </div>
  );
}
