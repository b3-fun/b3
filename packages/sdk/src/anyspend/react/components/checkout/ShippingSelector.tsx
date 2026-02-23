"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount, safeBigInt } from "@b3dotfun/sdk/shared/utils/number";
import type { ShippingOption } from "../../../types/forms";

interface ShippingSelectorProps {
  options: ShippingOption[];
  selectedId: string | null;
  onSelect: (option: ShippingOption) => void;
  tokenSymbol?: string;
  tokenDecimals?: number;
  className?: string;
}

function formatAmount(amount: string, decimals: number, symbol: string): string {
  const bi = safeBigInt(amount);
  if (bi === BigInt(0)) return "Free";
  return `${formatTokenAmount(bi, decimals)} ${symbol}`;
}

export function ShippingSelector({
  options,
  selectedId,
  onSelect,
  tokenSymbol = "",
  tokenDecimals = 6,
  className,
}: ShippingSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className={cn("anyspend-shipping-selector space-y-2", className)}>
      <div className="anyspend-shipping-title text-sm font-semibold text-gray-900 dark:text-gray-100">Shipping</div>
      <div className="anyspend-shipping-options space-y-2">
        {options.map(option => (
          <label
            key={option.id}
            className={cn(
              "anyspend-shipping-option flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors",
              selectedId === option.id
                ? "anyspend-shipping-option-selected border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:border-neutral-500",
            )}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                checked={selectedId === option.id}
                onChange={() => onSelect(option)}
                className="h-4 w-4 border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <div className="anyspend-shipping-option-name text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.name}
                </div>
                {(option.description || option.estimated_days) && (
                  <div className="anyspend-shipping-option-detail text-xs text-gray-500 dark:text-gray-400">
                    {option.description || (option.estimated_days && `${option.estimated_days}`)}
                  </div>
                )}
              </div>
            </div>
            <div className="anyspend-shipping-option-price text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatAmount(option.amount, tokenDecimals, tokenSymbol)}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
