"use client";

import { useGeoOnrampOptions } from "@b3dotfun/sdk/anyspend/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export enum FiatPaymentMethod {
  NONE = "none",
  COINBASE_PAY = "coinbase_pay",
  STRIPE = "stripe",
}

interface FiatPaymentMethodProps {
  selectedPaymentMethod: FiatPaymentMethod;
  setSelectedPaymentMethod: (method: FiatPaymentMethod) => void;
  onBack: () => void;
  onSelectPaymentMethod: (method: FiatPaymentMethod) => void;
  srcAmountOnRamp: string;
  isMainnet: boolean;
}

export function FiatPaymentMethodComponent({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  onBack,
  onSelectPaymentMethod,
  srcAmountOnRamp,
  isMainnet,
}: FiatPaymentMethodProps) {
  // Helper function to get fees from API data
  const getFeeFromApi = (paymentMethod: FiatPaymentMethod): string | null => {
    switch (paymentMethod) {
      case FiatPaymentMethod.COINBASE_PAY:
        // Coinbase doesn't provide fee info in API, return null
        return null;
      case FiatPaymentMethod.STRIPE:
        // Get fee from Stripe API response
        if (stripeWeb2Support && "formattedFeeUsd" in stripeWeb2Support) {
          return stripeWeb2Support.formattedFeeUsd;
        }
        return null;
      default:
        return null; // No fee when no payment method selected
    }
  };

  // Load geo-based onramp options like in PanelOnramp
  const {
    coinbaseAvailablePaymentMethods,
    isStripeOnrampSupported,
    stripeWeb2Support,
    isLoading: isLoadingGeoOnramp,
  } = useGeoOnrampOptions(isMainnet, srcAmountOnRamp);

  // Generate payment methods based on geo availability (like in PanelOnrampPayment)
  const availablePaymentMethods = [];

  // Add Coinbase Pay if available
  if (coinbaseAvailablePaymentMethods.length > 0) {
    const coinbaseFee = getFeeFromApi(FiatPaymentMethod.COINBASE_PAY);
    availablePaymentMethods.push({
      id: FiatPaymentMethod.COINBASE_PAY,
      name: "Coinbase Pay",
      description: "Debit card, bank account or Coinbase account",
      badge: coinbaseFee ? `$${coinbaseFee} fee` : "Lowest Fee",
      badgeColor: "bg-green-100 text-green-800",
      available: true,
    });
  }

  // Add Stripe if available
  if (isStripeOnrampSupported || (stripeWeb2Support && stripeWeb2Support.isSupport)) {
    const stripeFee = getFeeFromApi(FiatPaymentMethod.STRIPE);
    availablePaymentMethods.push({
      id: FiatPaymentMethod.STRIPE,
      name: "Stripe",
      description: "Credit or debit card payment",
      badge: stripeFee ? `$${stripeFee} fee` : "Standard Fee",
      badgeColor: "bg-yellow-100 text-yellow-800",
      available: true,
    });
  }

  // Show loading state while checking geo availability
  if (isLoadingGeoOnramp) {
    return (
      <div className="mx-auto w-[460px] max-w-full">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-as-quaternary hover:text-as-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h2 className="text-as-primary text-lg font-semibold">Choose payment method</h2>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-as-secondary ml-2 text-sm">Loading payment methods...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[460px] max-w-full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-as-quaternary hover:text-as-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-as-primary text-lg font-semibold">Choose payment method</h2>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex flex-col gap-3">
          {availablePaymentMethods.length === 0 ? (
            <div className="bg-as-surface-secondary border-as-border-secondary rounded-2xl border p-6 text-center">
              <p className="text-as-secondary text-sm">
                No payment methods available in your region for the selected amount.
              </p>
            </div>
          ) : (
            availablePaymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedPaymentMethod(method.id);
                  onSelectPaymentMethod(method.id);
                }}
                className={cn(
                  "bg-as-surface-secondary border-as-border-secondary flex w-full items-center gap-4 rounded-2xl border p-4 transition-all duration-200",
                  selectedPaymentMethod === method.id
                    ? "border-as-brand bg-as-brand/10"
                    : "hover:border-as-brand/50 hover:bg-as-brand/5",
                )}
              >
                {/* Icon - matching PanelOnramp style */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-2xl text-white">
                  {method.id === FiatPaymentMethod.COINBASE_PAY ? "C" : "S"}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col items-start text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-as-primary text-base font-semibold">{method.name}</span>
                    <span className={cn("rounded-full px-2 py-1 text-xs font-medium", method.badgeColor)}>
                      {method.badge}
                    </span>
                  </div>
                  <span className="text-as-primary/60 text-sm">{method.description}</span>
                </div>

                {/* Selection indicator */}
                {selectedPaymentMethod === method.id && <ChevronRight className="text-as-brand h-5 w-5" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
