import { useCoinbaseOnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend/utils/chain";
import { Input, toast, useGetGeo, useProfile } from "@b3dotfun/sdk/global-account/react";
import { cn, formatUsername } from "@b3dotfun/sdk/shared/utils";
import { formatAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { ChevronRight, Info, Wallet } from "lucide-react";
import { useRef } from "react";

import { FIAT_PAYMENT_METHOD_DISPLAY, FiatPaymentMethod } from "./FiatPaymentMethod";
import { OrderTokenAmountFiat } from "./OrderTokenAmountFiat";
import { PointsBadge } from "./PointsBadge";

const ONE_CHAR_WIDTH = 30;

export function PanelOnramp({
  srcAmountOnRamp,
  setSrcAmountOnRamp,
  selectedPaymentMethod,
  setActivePanel,
  _recipientAddress,
  destinationToken,
  destinationChainId,
  destinationAmount,
  onDestinationTokenChange,
  onDestinationChainChange,
  fiatPaymentMethodIndex,
  recipientSelectionPanelIndex,
  dstTokenSymbol,
  hideDstToken = false,
  anyspendQuote,
  onShowPointsDetail,
  onShowFeeDetail,
  customUsdInputValues = ["5", "10", "20", "25"],
  customRecipientLabel,
}: {
  srcAmountOnRamp: string;
  setSrcAmountOnRamp: (amount: string) => void;
  selectedPaymentMethod?: FiatPaymentMethod;
  setActivePanel: (panel: number) => void;
  _recipientAddress?: string;
  destinationToken?: components["schemas"]["Token"];
  destinationChainId?: number;
  destinationAmount?: string;
  onDestinationTokenChange?: (token: components["schemas"]["Token"]) => void;
  onDestinationChainChange?: (chainId: number) => void;
  fiatPaymentMethodIndex: number;
  recipientSelectionPanelIndex: number;
  dstTokenSymbol?: string;
  hideDstToken?: boolean;
  anyspendQuote?: GetQuoteResponse;
  onShowPointsDetail?: () => void;
  onShowFeeDetail?: () => void;
  customUsdInputValues?: string[];
  /** Custom label for recipient display (overrides recipientName) */
  customRecipientLabel?: string;
}) {
  // Helper function to get fees from anyspend quote
  const getFeeFromApi = (paymentMethod: FiatPaymentMethod): number | null => {
    // Try to get fee from anyspend quote first (most accurate)
    if (anyspendQuote?.data?.fee) {
      const fee = anyspendQuote.data.fee;
      if (fee.type === "stripeweb2_fee") {
        // Calculate total fee in USD from originalAmount - finalAmount
        const originalAmount = Number(fee.originalAmount) / 1e6; // Convert from wei to USD
        const finalAmount = Number(fee.finalAmount) / 1e6;
        return originalAmount - finalAmount;
      }
    }

    // Fallback to payment method defaults
    switch (paymentMethod) {
      case FiatPaymentMethod.COINBASE_PAY:
        return 0; // Coinbase has no additional fees
      case FiatPaymentMethod.STRIPE:
        return null; // No quote available yet
      default:
        return null;
    }
  };

  // Helper function to get total amount from API (for Stripe) or calculate it (for others)
  const getTotalAmount = (paymentMethod: FiatPaymentMethod): number => {
    const baseAmount = parseFloat(srcAmountOnRamp) || 5;

    // For stripeweb2_fee, use the originalAmount
    if (anyspendQuote?.data?.fee?.type === "stripeweb2_fee") {
      return Number(anyspendQuote.data.fee.originalAmount) / 1e6; // Convert from wei to USD
    }

    // Use currencyIn.amountUsd from quote when available (includes fees, most accurate for custom orders)
    if (anyspendQuote?.data?.currencyIn?.amountUsd) {
      return Number(anyspendQuote.data.currencyIn.amountUsd);
    }

    const fee = getFeeFromApi(paymentMethod);

    // For Coinbase or when fee is available, calculate manually
    if (fee !== null) {
      return baseAmount + fee;
    }

    // No fee available, return base amount
    return baseAmount;
  };

  // Get geo data for onramp availability
  const { geoData } = useGetGeo();
  const { coinbaseOnrampOptions } = useCoinbaseOnrampOptions(geoData?.country || "US");

  // Get recipient profile for displaying name
  const recipientProfile = useProfile({ address: _recipientAddress });
  const recipientName = recipientProfile.data?.name;

  const amountInputRef = useRef<HTMLInputElement>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, "");
    // Get the max limit from payment currencies
    const maxLimit =
      coinbaseOnrampOptions?.paymentCurrencies?.[0]?.limits?.find(l => l.id === "ACH_BANK_ACCOUNT")?.max || "25000";
    const numValue = parseFloat(value);
    if (!Number.isNaN(numValue) && numValue > parseFloat(maxLimit)) {
      toast.error(`Maximum amount is $${maxLimit}`);
      setSrcAmountOnRamp(maxLimit);
      return;
    }
    setSrcAmountOnRamp(value);
  };

  const handleQuickAmount = (value: string) => {
    setSrcAmountOnRamp(value);
  };

  return (
    <div className="panel-onramp bg-as-surface-primary flex w-full flex-col">
      {/* Pay Section */}
      <div className="border-as-border-secondary bg-as-surface-secondary relative flex w-full flex-col rounded-2xl border p-4">
        <div className="flex h-7 w-full items-center justify-between">
          <span className="text-as-tertiarry flex items-center text-sm font-bold">Pay</span>
          <button
            className="text-as-tertiarry flex h-7 items-center gap-1 text-sm"
            onClick={() => setActivePanel(fiatPaymentMethodIndex)} // PanelView.FIAT_PAYMENT_METHOD
          >
            {(() => {
              const config = selectedPaymentMethod ? FIAT_PAYMENT_METHOD_DISPLAY[selectedPaymentMethod] : null;
              if (config) {
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <span className="text-xs font-bold text-white">{config.icon}</span>
                      </div>
                      {config.label}
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </>
                );
              }
              return (
                <>
                  Select payment method
                  <ChevronRight className="h-4 w-4" />
                </>
              );
            })()}
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex items-center justify-center pb-2 pt-8">
          <div className="flex gap-1">
            <span className="text-as-tertiarry text-2xl font-bold">$</span>
            <Input
              ref={amountInputRef}
              type="text"
              value={srcAmountOnRamp}
              onChange={handleAmountChange}
              placeholder="5"
              className="text-as-primary placeholder:text-as-primary/50 h-auto border-0 bg-transparent p-0 px-1 pt-1 text-4xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{
                width: `${Math.max(ONE_CHAR_WIDTH, srcAmountOnRamp.length * ONE_CHAR_WIDTH)}px`,
              }}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className={cn("mx-auto mb-6 flex justify-center gap-2", hideDstToken && "mb-0")}>
          {customUsdInputValues
            .filter(v => !isNaN(Number(v)))
            .map(value => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className={`bg-as-surface-secondary border-as-border-secondary hover:border-as-border-secondary h-7 w-14 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  srcAmountOnRamp === value
                    ? "border-as-border-secondary bg-as-surface-secondary"
                    : "bg-as-surface-secondary hover:bg-as-surface-secondary"
                }`}
              >
                ${value}
              </button>
            ))}
        </div>

        {/* Token Display */}
        {destinationToken && destinationChainId && !hideDstToken && (
          <OrderTokenAmountFiat
            address={_recipientAddress}
            context="to"
            inputValue={destinationAmount || "0"}
            onChangeInput={() => {}} // Read-only in this context
            chainId={destinationChainId}
            setChainId={onDestinationChainChange || (() => {})}
            token={destinationToken}
            setToken={onDestinationTokenChange || (() => {})}
          />
        )}
      </div>

      {/* Recipient Section */}
      <div className="border-as-border-secondary bg-as-surface-secondary mt-4 flex w-full flex-col gap-3 rounded-xl border p-4">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-as-tertiarry flex items-center text-sm">Recipient</span>
          {_recipientAddress ? (
            <button
              className="text-as-tertiarry flex h-7 items-center gap-1 text-sm transition-colors hover:text-blue-700"
              onClick={() => setActivePanel(recipientSelectionPanelIndex)} // Recipient selection panel
            >
              <span className="text-sm">
                {customRecipientLabel ||
                  (recipientName ? formatUsername(recipientName) : formatAddress(_recipientAddress))}
              </span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="text-as-tertiarry flex h-7 items-center gap-1 text-sm transition-colors hover:text-blue-700"
              onClick={() => setActivePanel(5)} // Recipient selection panel
            >
              <Wallet className="text-as-brand" size={16} />
              Select recipient
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div className="divider w-full" />

        <div className="flex items-center justify-between gap-4">
          <span className="text-as-tertiarry text-sm">Expected to receive</span>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <span className="text-as-primary font-semibold">
              {destinationAmount || "0"} {dstTokenSymbol || destinationToken?.symbol || ""}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-as-tertiarry text-sm">
                on {destinationChainId ? ALL_CHAINS[destinationChainId]?.name : ""}
              </span>
              {destinationToken && destinationChainId && destinationToken.metadata?.logoURI && (
                <img src={ALL_CHAINS[destinationChainId]?.logoUrl} alt="Chain" className="h-4 w-4 rounded-full" />
              )}
            </div>
          </div>
        </div>

        <div className="divider w-full" />

        <div className="">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-as-tertiarry text-sm">Total</span>
              {anyspendQuote?.data?.fee && onShowFeeDetail && (
                <button
                  onClick={onShowFeeDetail}
                  className="text-as-primary/40 hover:text-as-primary/60 transition-colors"
                >
                  <Info className="h-4 w-4" />
                </button>
              )}
              {anyspendQuote?.data?.pointsAmount && anyspendQuote?.data?.pointsAmount > 0 && (
                <PointsBadge
                  pointsAmount={anyspendQuote.data.pointsAmount}
                  pointsMultiplier={anyspendQuote.data.pointsMultiplier}
                  onClick={() => onShowPointsDetail?.()}
                />
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-as-primary font-semibold">
                ${getTotalAmount(selectedPaymentMethod || FiatPaymentMethod.NONE).toFixed(2)}
              </span>
              {(() => {
                // For fiat payments, show the fee from the payment method
                const fiatFee = getFeeFromApi(selectedPaymentMethod || FiatPaymentMethod.NONE);
                if (fiatFee !== null && fiatFee > 0) {
                  return <span className="text-as-secondary text-xs">incl. ${fiatFee.toFixed(2)} fee</span>;
                }

                // For crypto payments (standard_fee), calculate from the quote
                if (anyspendQuote?.data?.fee?.type === "standard_fee" && anyspendQuote.data.currencyIn?.amountUsd) {
                  const cryptoFee =
                    (Number(anyspendQuote.data.currencyIn.amountUsd) * anyspendQuote.data.fee.finalFeeBps) / 10000;
                  if (cryptoFee > 0) {
                    return <span className="text-as-secondary text-xs">incl. ${cryptoFee.toFixed(2)} fee</span>;
                  }
                }

                return null;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
