import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { formatDisplayNumber } from "@b3dotfun/sdk/shared/utils/number";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { components } from "../../../types/api";
import { OrderTokenAmount } from "./OrderTokenAmount";

interface ReceiveSectionProps {
  paymentType: "crypto" | "fiat";
  isDepositMode?: boolean;
  isBuyMode?: boolean;
  // Recipient data
  selectedRecipientAddress?: string;
  recipientName?: string;
  onSelectRecipient: () => void;
  // Token data
  dstAmount: string;
  dstToken: components["schemas"]["Token"];
  // Token selection for non-buy mode
  selectedDstChainId?: number;
  setSelectedDstChainId?: (chainId: number) => void;
  setSelectedDstToken?: (token: components["schemas"]["Token"]) => void;
  onChangeDstAmount?: (value: string) => void;
  // Quote data
  anyspendQuote?: any;
  _globalAddress?: string;
}

export function ReceiveSection({
  paymentType,
  isDepositMode = false,
  isBuyMode = false,
  selectedRecipientAddress,
  recipientName,
  onSelectRecipient,
  dstAmount,
  dstToken,
  selectedDstChainId,
  setSelectedDstChainId,
  setSelectedDstToken,
  onChangeDstAmount,
  anyspendQuote,
  _globalAddress,
}: ReceiveSectionProps) {
  if (paymentType === "fiat") {
    /* Fiat recipient section like PanelOnramp */
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
        className="bg-as-surface-secondary border-as-border-secondary mt-4 flex w-full flex-col gap-3 rounded-xl border p-4"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-as-tertiarry flex items-center text-sm">Recipient</span>
          {selectedRecipientAddress ? (
            <button
              className="text-as-tertiarry flex h-7 items-center gap-1 text-sm transition-colors"
              onClick={onSelectRecipient}
            >
              <span className="text-sm">
                {recipientName ? formatUsername(recipientName) : shortenAddress(selectedRecipientAddress)}
              </span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="text-as-tertiarry flex h-7 items-center gap-1 text-sm transition-colors"
              onClick={onSelectRecipient}
            >
              Select recipient
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div className="divider w-full" />

        <div className="flex items-center justify-between">
          <span className="text-as-tertiarry text-sm">Expected to receive</span>
          <div className="flex items-center gap-2">
            <span className="text-as-primary font-semibold">
              {dstAmount || "0"} {dstToken.symbol}
            </span>
            <span className="text-as-tertiarry text-sm">on Base</span>
            {dstToken.metadata?.logoURI && (
              <img src={dstToken.metadata.logoURI} alt={dstToken.symbol} className="h-4 w-4 rounded-full" />
            )}
          </div>
        </div>

        <div className="divider w-full" />

        <div className="flex items-center justify-between">
          <span className="text-as-tertiarry text-sm">Total</span>
          <span className="text-as-tertiarry text-sm">
            {formatDisplayNumber(anyspendQuote?.data?.currencyOut?.amountUsd, {
              style: "currency",
              fallback: "",
            })}
          </span>
        </div>
      </motion.div>
    );
  }

  /* Crypto receive section */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
      className="receive-section bg-as-surface-secondary border-as-border-secondary relative flex w-full flex-col gap-2 rounded-2xl border p-4 sm:p-6"
    >
      <div className="flex w-full items-center justify-between">
        <div className="text-as-primary/50 flex h-7 items-center text-sm">{isDepositMode ? "Deposit" : "Receive"}</div>
        {selectedRecipientAddress ? (
          <button
            className={cn("text-as-tertiarry flex h-7 items-center gap-2 rounded-lg")}
            onClick={onSelectRecipient}
          >
            <>
              <span className="text-as-tertiarry flex items-center gap-1 text-sm">
                {recipientName ? formatUsername(recipientName) : shortenAddress(selectedRecipientAddress || "")}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          </button>
        ) : (
          <button className="text-as-primary/70 flex items-center gap-1 rounded-lg" onClick={onSelectRecipient}>
            <div className="text-sm font-medium">Select recipient</div>
          </button>
        )}
      </div>
      {isBuyMode || isDepositMode ? (
        // Fixed destination token display for buy mode and deposit mode
        <div className="flex items-center justify-between">
          <div className="text-as-primary text-2xl font-bold">{dstAmount || "0"}</div>
          <div className="bg-as-brand/10 border-as-brand/30 flex items-center gap-3 rounded-xl border px-4 py-3">
            {dstToken.metadata?.logoURI && (
              <img src={dstToken.metadata.logoURI} alt={dstToken.symbol} className="h-8 w-8 rounded-full" />
            )}
            <span className="text-as-brand text-lg font-bold">{dstToken.symbol}</span>
          </div>
        </div>
      ) : (
        // Token selection for regular swap mode
        <OrderTokenAmount
          address={selectedRecipientAddress}
          context="to"
          inputValue={dstAmount}
          onChangeInput={onChangeDstAmount || (() => {})}
          chainId={selectedDstChainId || dstToken.chainId}
          setChainId={setSelectedDstChainId || (() => {})}
          token={dstToken}
          setToken={setSelectedDstToken || (() => {})}
        />
      )}
      <div className="text-as-primary/50 flex h-5 items-center text-sm">
        {formatDisplayNumber(anyspendQuote?.data?.currencyOut?.amountUsd, {
          style: "currency",
          fallback: "",
        })}
        {anyspendQuote?.data?.currencyIn?.amountUsd &&
          anyspendQuote?.data?.currencyOut?.amountUsd &&
          (() => {
            const calculatePriceImpact = (inputUsd?: string | number, outputUsd?: string | number) => {
              if (!inputUsd || !outputUsd) {
                return { percentage: "0.00", isNegative: false };
              }

              const input = Number(inputUsd);
              const output = Number(outputUsd);

              // Handle edge cases
              if (input === 0 || isNaN(input) || isNaN(output) || input <= output) {
                return { percentage: "0.00", isNegative: false };
              }

              const percentageValue = ((output - input) / input) * 100;

              // Handle the -0.00% case
              if (percentageValue > -0.005 && percentageValue < 0) {
                return { percentage: "0.00", isNegative: false };
              }

              return {
                percentage: Math.abs(percentageValue).toFixed(2),
                isNegative: percentageValue < 0,
              };
            };

            const { percentage, isNegative } = calculatePriceImpact(
              anyspendQuote.data.currencyIn.amountUsd,
              anyspendQuote.data.currencyOut.amountUsd,
            );

            // Parse the percentage as a number for comparison
            const percentageNum = parseFloat(percentage);

            // Don't show if less than 1%
            if (percentageNum < 1) {
              return null;
            }

            // Using inline style to ensure color displays
            return (
              <span className="ml-2" style={{ color: percentageNum >= 10 ? "red" : "#FFD700" }}>
                ({isNegative ? "-" : ""}
                {percentage}%)
              </span>
            );
          })()}
      </div>
    </motion.div>
  );
}
