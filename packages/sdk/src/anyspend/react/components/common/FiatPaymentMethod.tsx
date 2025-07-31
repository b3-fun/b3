"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { ChevronLeft } from "lucide-react";

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
}

export function FiatPaymentMethodComponent({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  onBack,
  onSelectPaymentMethod,
}: FiatPaymentMethodProps) {
  const paymentMethods = [
    {
      id: FiatPaymentMethod.COINBASE_PAY,
      name: "Coinbase Pay",
      description: "Debit card, bank account or Coinbase account",
      icon: "💙", // Coinbase blue circle
      badge: "Lowest Fee",
      badgeColor: "bg-green-100 text-green-800",
    },
    {
      id: FiatPaymentMethod.STRIPE,
      name: "Stripe",
      description: "Credit or debit card payment",
      icon: "💜", // Stripe purple circle
      badge: "Standard Fee",
      badgeColor: "bg-yellow-100 text-yellow-800",
    },
  ];

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
          {paymentMethods.map(method => (
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
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-2xl text-white">
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
