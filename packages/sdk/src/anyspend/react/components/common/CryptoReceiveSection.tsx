import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { formatDisplayNumber } from "@b3dotfun/sdk/shared/utils/number";
import { ChevronRight, Info } from "lucide-react";
import { motion } from "motion/react";
import { components } from "../../../types/api";
import type { CryptoReceiveSectionClasses } from "../types/classes";
import { OrderTokenAmount } from "./OrderTokenAmount";
import { PointsBadge } from "./PointsBadge";

interface CryptoReceiveSectionProps {
  isDepositMode?: boolean;
  isBuyMode?: boolean;
  // Recipient data
  effectiveRecipientAddress?: string;
  recipientName?: string;
  /** Custom label for recipient display (overrides recipientName) */
  customRecipientLabel?: string;
  onSelectRecipient: () => void;
  // Token data
  dstAmount: string;
  dstToken: components["schemas"]["Token"];
  // Token selection for non-buy mode
  selectedDstChainId?: number;
  setSelectedDstChainId?: (chainId: number) => void;
  setSelectedDstToken?: (token: components["schemas"]["Token"]) => void;
  isSrcInputDirty: boolean;
  onChangeDstAmount?: (value: string) => void;
  /** Whether the destination amount input is disabled */
  disableAmountInput?: boolean;
  // Quote data
  anyspendQuote?: any;
  // custom dst token data
  dstTokenSymbol?: string;
  dstTokenLogoURI?: string;
  // Points navigation
  onShowPointsDetail?: () => void;
  // Fee detail navigation
  onShowFeeDetail?: () => void;
  // Custom classes for styling
  classes?: CryptoReceiveSectionClasses;
}

export function CryptoReceiveSection({
  isDepositMode = false,
  isBuyMode = false,
  effectiveRecipientAddress,
  recipientName,
  customRecipientLabel,
  onSelectRecipient,
  dstAmount,
  dstToken,
  selectedDstChainId,
  setSelectedDstChainId,
  setSelectedDstToken,
  isSrcInputDirty,
  onChangeDstAmount,
  disableAmountInput,
  anyspendQuote,
  dstTokenSymbol,
  dstTokenLogoURI,
  onShowPointsDetail,
  onShowFeeDetail,
  classes,
}: CryptoReceiveSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
      className={
        classes?.container ||
        "receive-section bg-as-surface-secondary border-as-border-secondary relative flex w-full flex-col gap-2 rounded-2xl border p-4 sm:p-6"
      }
    >
      <div className="flex w-full items-center justify-between">
        <div className={classes?.label || "text-as-primary/50 flex h-7 items-center gap-1.5 text-sm"}>
          {isDepositMode ? "Deposit" : "Receive"}
          {isSrcInputDirty && anyspendQuote?.data?.fee && onShowFeeDetail && (
            <button onClick={onShowFeeDetail} className="text-as-primary/40 hover:text-as-primary/60 transition-colors">
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
        {effectiveRecipientAddress ? (
          <button
            className={classes?.recipientButton || "text-as-tertiarry flex h-7 items-center gap-2 rounded-lg"}
            onClick={onSelectRecipient}
          >
            <>
              <span className={classes?.recipientValue || "text-as-tertiarry flex items-center gap-1 text-sm"}>
                {customRecipientLabel ||
                  (recipientName ? formatUsername(recipientName) : shortenAddress(effectiveRecipientAddress || ""))}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          </button>
        ) : (
          <button
            className={classes?.recipientButton || "text-as-primary/70 flex items-center gap-1 rounded-lg"}
            onClick={onSelectRecipient}
          >
            <div className="text-sm font-medium">Select recipient</div>
          </button>
        )}
      </div>
      {isBuyMode || isDepositMode ? (
        // Fixed destination token display for buy mode and deposit mode
        <div className={classes?.inputContainer || "flex items-center justify-between"}>
          <div className={classes?.input || "text-as-primary text-2xl font-bold"}>{dstAmount || "0"}</div>
          <div
            className={
              classes?.tokenSelector ||
              "bg-as-brand/10 border-as-brand/30 flex items-center gap-3 rounded-xl border px-4 py-3"
            }
          >
            {(dstTokenLogoURI || dstToken.metadata?.logoURI) && (
              <div className="relative">
                <img
                  src={dstTokenLogoURI || dstToken.metadata?.logoURI}
                  alt={dstTokenSymbol || dstToken.symbol}
                  className={classes?.tokenIcon || "h-8 w-8 rounded-full"}
                />
                {/* Chain logo overlay */}
                {ALL_CHAINS[dstToken.chainId]?.logoUrl && (
                  <img
                    src={ALL_CHAINS[dstToken.chainId].logoUrl}
                    alt="Chain"
                    className={
                      classes?.chainBadge || "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-white"
                    }
                  />
                )}
              </div>
            )}
            <span className={classes?.tokenSymbol || "text-as-brand text-lg font-bold"}>
              {dstTokenSymbol || dstToken.symbol}
            </span>
          </div>
        </div>
      ) : (
        // Token selection for regular swap mode
        <div className={classes?.inputContainer}>
          <OrderTokenAmount
            address={effectiveRecipientAddress}
            context="to"
            inputValue={dstAmount}
            onChangeInput={onChangeDstAmount || (() => {})}
            chainId={selectedDstChainId || dstToken.chainId}
            setChainId={setSelectedDstChainId || (() => {})}
            token={dstToken}
            setToken={setSelectedDstToken || (() => {})}
            disabled={disableAmountInput}
          />
        </div>
      )}
      <div className={classes?.feeRow || "text-as-primary/50 flex h-5 items-center justify-start gap-2 text-sm"}>
        <div className="flex items-center gap-2">
          {formatDisplayNumber(anyspendQuote?.data?.currencyOut?.amountUsd, {
            style: "currency",
            fallback: "",
          })}
          {anyspendQuote?.data?.currencyIn?.amountUsd &&
            anyspendQuote?.data?.currencyOut?.amountUsd &&
            (() => {
              const calculatePriceImpact = (inputUsd?: string | number, outputUsd?: string | number) => {
                if (!inputUsd || !outputUsd) {
                  return { percentage: "0.00", percentageNum: 0, isNegative: false };
                }

                const input = Number(inputUsd);
                const output = Number(outputUsd);

                // Handle edge cases
                if (input === 0 || isNaN(input) || isNaN(output) || input <= output) {
                  return { percentage: "0.00", percentageNum: 0, isNegative: false };
                }

                const percentageValue = ((output - input) / input) * 100;

                // Handle the -0.00% case
                if (percentageValue > -0.005 && percentageValue < 0) {
                  return { percentage: "0.00", percentageNum: 0, isNegative: false };
                }

                return {
                  percentage: Math.abs(percentageValue).toFixed(2),
                  percentageNum: Math.abs(percentageValue),
                  isNegative: percentageValue < 0,
                };
              };

              const { percentage, percentageNum, isNegative } = calculatePriceImpact(
                anyspendQuote.data.currencyIn.amountUsd,
                anyspendQuote.data.currencyOut.amountUsd,
              );

              // Get the fee percentage if available
              const feePercent = anyspendQuote.data.fee?.finalFeeBps ? anyspendQuote.data.fee.finalFeeBps / 100 : 0;

              // Calculate actual slippage (price impact minus fee)
              const actualSlippage = percentageNum - feePercent;

              // Show warning based on actual slippage, not total impact
              const yellowThreshold = 1; // 1% actual slippage
              const redThreshold = 2; // 2% actual slippage

              // Don't show if actual slippage is less than yellow threshold
              if (actualSlippage < yellowThreshold) {
                return null;
              }

              // Using inline style to ensure color displays
              return (
                <span className="ml-2" style={{ color: actualSlippage >= redThreshold ? "red" : "#FFD700" }}>
                  ({isNegative ? "-" : ""}
                  {percentage}%)
                </span>
              );
            })()}
        </div>
        {anyspendQuote?.data?.pointsAmount > 0 && (
          <PointsBadge
            pointsAmount={anyspendQuote.data.pointsAmount}
            pointsMultiplier={anyspendQuote.data.pointsMultiplier}
            onClick={() => onShowPointsDetail?.()}
          />
        )}
      </div>
    </motion.div>
  );
}
