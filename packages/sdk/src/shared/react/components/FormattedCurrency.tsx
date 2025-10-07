"use client";

import { B3_COIN_IMAGE_URL } from "@b3dotfun/sdk/shared/constants/currency";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../global-account/react/components/ui/tooltip";
import { useCurrencyConversion } from "../hooks/useCurrencyConversion";
import { useCurrencyModalStore } from "../stores/currencyModalStore";

interface FormattedCurrencyProps {
  amount: number;
  showChange?: boolean;
  showColor?: boolean;
  className?: string;
  subB3Icon?: boolean;
  clickable?: boolean;
  decimals?: number;
  currency?: string; // Override currency (e.g., "ETH", "USDC", "B3")
}

export function FormattedCurrency({
  amount,
  showChange = false,
  showColor = false,
  className,
  subB3Icon = true,
  clickable = true,
  decimals,
  currency,
}: FormattedCurrencyProps) {
  const { formatCurrencyValue, formatTooltipValue, selectedCurrency, baseCurrency } = useCurrencyConversion();
  const { openModal } = useCurrencyModalStore();

  // Use passed currency or fall back to selected currency
  const activeCurrency = currency || selectedCurrency;

  const isPositive = amount >= 0;

  // Get the formatted value (using absolute value for negative numbers when showing change)
  const baseAmount = showChange ? Math.abs(amount) : amount;

  // Use centralized formatting from hook with optional overrides
  const formattedValue = formatCurrencyValue(baseAmount, {
    decimals,
    currency,
  });

  // Generate tooltip using the centralized hook function
  const baseTooltipValue = formatTooltipValue(amount, currency);

  // Add change indicator if needed
  const tooltipValue = showChange ? `${isPositive ? "+" : "-"}${baseTooltipValue}` : baseTooltipValue;

  // Determine color class
  let colorClass = "";
  if (showColor) {
    if (isPositive) {
      colorClass = "text-green-400";
    } else {
      colorClass = "text-red-400";
    }
  }

  // Add change indicator
  let displayValue = formattedValue;
  if (showChange) {
    if (isPositive) {
      displayValue = `+${formattedValue}`;
    } else {
      displayValue = `-${formattedValue}`;
    }
  }

  const handleClick = () => {
    if (clickable) {
      openModal();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap",
            colorClass,
            className,
            clickable && "cursor-pointer transition-opacity hover:opacity-80",
          )}
        >
          {subB3Icon &&
          (currency === baseCurrency || (!currency && activeCurrency === baseCurrency)) &&
          baseCurrency === "B3"
            ? displayValue.split(" ")[0]
            : displayValue}
          {subB3Icon &&
            (currency === baseCurrency || (!currency && activeCurrency === baseCurrency)) &&
            baseCurrency === "B3" && (
              <img src={B3_COIN_IMAGE_URL} className="inline-block h-4 w-4 align-middle" alt="B3 coin" />
            )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipValue}</TooltipContent>
    </Tooltip>
  );
}
