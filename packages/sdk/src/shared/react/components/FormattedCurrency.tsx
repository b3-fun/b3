"use client";

import { B3_COIN_IMAGE_URL } from "@b3dotfun/sdk/shared/constants/currency";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../global-account/react/components/ui/tooltip";
import { useCurrencyConversion } from "../hooks/useCurrencyConversion";
import { useCurrencyModalStore } from "../stores/currencyModalStore";

interface FormattedCurrencyProps {
  amount: string; // Wei amount as string (will be divided by 1e18)
  sourceCurrency: string; // The currency the amount is in (e.g., "WIN", "B3", "USD")
  showChange?: boolean;
  showColor?: boolean;
  className?: string;
  subB3Icon?: boolean;
  clickable?: boolean;
  decimals?: number;
}

export function FormattedCurrency({
  amount,
  sourceCurrency,
  showChange = false,
  showColor = false,
  className,
  subB3Icon = true,
  clickable = true,
  decimals,
}: FormattedCurrencyProps) {
  const { formatCurrencyValue, formatTooltipValue, selectedCurrency, baseCurrency, customCurrencies } = useCurrencyConversion();
  const { openModal } = useCurrencyModalStore();

  // Get the number of decimals for this currency to convert from smallest unit
  const getDecimalPlaces = (currency: string): number => {
    // Check custom currencies first
    const customMetadata = customCurrencies[currency];
    if (customMetadata?.decimals !== undefined) {
      return customMetadata.decimals;
    }

    // Default decimal places for built-in currencies
    if (currency === "WIN" || currency === "ETH" || currency === "SOL" || currency === "B3") {
      return 18;
    }
    if (currency === "USD" || currency === "EUR" || currency === "GBP" || currency === "CAD" || currency === "AUD") {
      return 2;
    }
    if (currency === "JPY" || currency === "KRW") {
      return 0;
    }
    return 18; // Default to 18 decimals (wei)
  };

  // Convert from smallest unit to human-readable using currency's decimal places
  const decimalPlaces = getDecimalPlaces(sourceCurrency);
  const divisor = Math.pow(10, decimalPlaces);
  const parsedAmount = parseFloat(amount) / divisor;
  const isPositive = parsedAmount >= 0;

  // Get the formatted value (using absolute value for negative numbers when showing change)
  const baseAmount = showChange ? Math.abs(parsedAmount) : parsedAmount;

  // Format value with automatic conversion from source to display currency
  const formattedValue = formatCurrencyValue(baseAmount, sourceCurrency, { decimals });

  // Generate tooltip using the centralized hook function
  const baseTooltipValue = formatTooltipValue(parsedAmount, sourceCurrency);

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

  // Check if we should show B3 icon (when displaying in B3 and baseCurrency is B3)
  const shouldShowB3Icon = subB3Icon && selectedCurrency === "B3" && baseCurrency === "B3";

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
          {shouldShowB3Icon ? displayValue.split(" ")[0] : displayValue}
          {shouldShowB3Icon && (
            <img src={B3_COIN_IMAGE_URL} className="inline-block h-4 w-4 align-middle" alt="B3 coin" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipValue}</TooltipContent>
    </Tooltip>
  );
}
