"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { formatTokenAmount, safeBigInt } from "@b3dotfun/sdk/shared/utils/number";
import { X, Loader2, Check } from "lucide-react";
import { useState, useCallback } from "react";
import type { DiscountResult } from "../../../types/forms";

interface DiscountCodeInputProps {
  onApply: (code: string) => Promise<DiscountResult>;
  appliedDiscount: DiscountResult | null;
  onRemove: () => void;
  loading?: boolean;
  tokenSymbol?: string;
  tokenDecimals?: number;
  className?: string;
}

function formatAmount(amount: string, decimals: number, symbol: string): string {
  const bi = safeBigInt(amount);
  if (bi === BigInt(0)) return "Free";
  return `${formatTokenAmount(bi, decimals)} ${symbol}`;
}

export function DiscountCodeInput({
  onApply,
  appliedDiscount,
  onRemove,
  loading = false,
  tokenSymbol = "",
  tokenDecimals = 6,
  className,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleApply = useCallback(async () => {
    if (!code.trim()) return;
    setError(null);
    setIsValidating(true);
    try {
      const result = await onApply(code.trim());
      if (!result.valid) {
        setError(result.error || "Invalid discount code");
      } else {
        setCode("");
      }
    } catch {
      setError("Failed to validate discount code");
    } finally {
      setIsValidating(false);
    }
  }, [code, onApply]);

  const handleRemove = () => {
    onRemove();
    setError(null);
  };

  // Show applied discount state
  if (appliedDiscount?.valid) {
    return (
      <div className={cn("anyspend-discount anyspend-discount-applied space-y-2", className)}>
        <div className="anyspend-discount-title text-sm font-semibold text-gray-900 dark:text-gray-100">Discount</div>
        <div className="anyspend-discount-badge flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="anyspend-discount-value text-sm font-medium text-green-700 dark:text-green-300">
              {appliedDiscount.discount_type === "percentage"
                ? `${appliedDiscount.discount_value}% off`
                : appliedDiscount.discount_amount
                  ? `-${formatAmount(appliedDiscount.discount_amount, tokenDecimals, tokenSymbol)}`
                  : "Discount applied"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="anyspend-discount-remove rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("anyspend-discount space-y-2", className)}>
      <div className="anyspend-discount-title text-sm font-semibold text-gray-900 dark:text-gray-100">
        Discount Code
      </div>
      <div className="anyspend-discount-input-row flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="Enter code"
          disabled={loading || isValidating}
          className={cn(
            "anyspend-discount-input flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
            error && "border-red-400",
          )}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || loading || isValidating}
          className="anyspend-discount-apply rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && <p className="anyspend-discount-error text-xs text-red-500">{error}</p>}
    </div>
  );
}
