import { useCoinbaseOnrampOptions, useGeoOnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend/utils/chain";
import { Input, useGetGeo, useProfile } from "@b3dotfun/sdk/global-account/react";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { formatAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { ChevronRight, Wallet } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { FiatPaymentMethod } from "./FiatPaymentMethod";
import { OrderTokenAmountFiat } from "./OrderTokenAmountFiat";

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
}) {
  // Get geo-based onramp options to access fee information
  const { stripeWeb2Support } = useGeoOnrampOptions(srcAmountOnRamp);

  // Helper function to get fees from API data
  const getFeeFromApi = (paymentMethod: FiatPaymentMethod): number | null => {
    switch (paymentMethod) {
      case FiatPaymentMethod.COINBASE_PAY:
        // Coinbase doesn't provide fee info in API, return 0
        return 0;
      case FiatPaymentMethod.STRIPE:
        // Get fee from Stripe API response
        if (stripeWeb2Support && "formattedFeeUsd" in stripeWeb2Support) {
          return parseFloat(stripeWeb2Support.formattedFeeUsd) || 0;
        }
        return null;
      default:
        return null; // No fee when no payment method selected
    }
  };

  // Helper function to get total amount from API (for Stripe) or calculate it (for others)
  const getTotalAmount = (paymentMethod: FiatPaymentMethod): number => {
    const baseAmount = parseFloat(srcAmountOnRamp) || 5;
    const fee = getFeeFromApi(paymentMethod);

    if (paymentMethod === FiatPaymentMethod.STRIPE && stripeWeb2Support && "formattedTotalUsd" in stripeWeb2Support) {
      // Use the total from Stripe API if available
      return parseFloat(stripeWeb2Support.formattedTotalUsd) || baseAmount;
    }

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
            {selectedPaymentMethod === FiatPaymentMethod.COINBASE_PAY ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-xs font-bold text-white">C</span>
                  </div>
                  Coinbase Pay
                </div>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : selectedPaymentMethod === FiatPaymentMethod.STRIPE ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-xs font-bold text-white">S</span>
                  </div>
                  Stripe
                </div>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Select payment method
                <ChevronRight className="h-4 w-4" />
              </>
            )}
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
              className="text-as-primary placeholder:text-as-primary/50 h-auto min-w-[70px] border-0 bg-transparent p-0 px-3 pt-1 text-4xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{
                width: `${Math.max(50, srcAmountOnRamp.length * 34)}px`,
              }}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="mx-auto mb-6 inline-grid grid-cols-4 gap-2">
          {["5", "10", "20", "25"].map(value => (
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
        {destinationToken && destinationChainId && (
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
                {recipientName ? formatUsername(recipientName) : formatAddress(_recipientAddress)}
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

        <div className="flex items-center justify-between">
          <span className="text-as-tertiarry text-sm">Expected to receive</span>
          <div className="flex items-center gap-2">
            <span className="text-as-primary font-semibold">
              {destinationAmount || "0"} {destinationToken?.symbol || ""}
            </span>
            <span className="text-as-tertiarry text-sm">
              on {destinationChainId ? ALL_CHAINS[destinationChainId]?.name : ""}
            </span>
            {destinationToken && destinationChainId && destinationToken.metadata?.logoURI && (
              <img src={ALL_CHAINS[destinationChainId]?.logoUrl} alt="Chain" className="h-4 w-4 rounded-full" />
            )}
          </div>
        </div>

        <div className="divider w-full" />

        <div className="">
          <div className="flex items-center justify-between">
            {(() => {
              const currentPaymentMethod = selectedPaymentMethod || FiatPaymentMethod.NONE;
              const fee = getFeeFromApi(currentPaymentMethod);

              return (
                <>
                  <span className="text-as-tertiarry text-sm">
                    {fee !== null ? `Total (included $${fee.toFixed(2)} fee)` : "Total"}
                  </span>
                  <span className="text-as-primary font-semibold">
                    ${getTotalAmount(currentPaymentMethod).toFixed(2)}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
