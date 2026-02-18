"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { CreditCard, Wallet } from "lucide-react";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

export type PaymentMethod = "crypto" | "fiat";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  classes?: AnySpendCheckoutClasses;
}

export function PaymentMethodSelector({ selected, onSelect, classes }: PaymentMethodSelectorProps) {
  return (
    <div className={cn("flex gap-2", classes?.paymentMethodSelector)}>
      <button
        onClick={() => onSelect("crypto")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
          selected === "crypto"
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600",
          classes?.paymentMethodButton,
        )}
      >
        <Wallet className="h-4 w-4" />
        Crypto
      </button>
      <button
        onClick={() => onSelect("fiat")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
          selected === "fiat"
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600",
          classes?.paymentMethodButton,
        )}
      >
        <CreditCard className="h-4 w-4" />
        Card
      </button>
    </div>
  );
}
