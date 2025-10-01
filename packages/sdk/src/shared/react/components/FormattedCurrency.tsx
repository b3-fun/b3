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
  const { formatCurrencyValue, selectedCurrency, baseCurrency, exchangeRate } = useCurrencyConversion();
  const { openModal } = useCurrencyModalStore();

  // Use passed currency or fall back to selected currency
  const activeCurrency = currency || selectedCurrency;

  const isPositive = amount >= 0;

  // Get the formatted value (using absolute value for negative numbers when showing change)
  const baseAmount = showChange ? Math.abs(amount) : amount;

  // Use custom decimal formatting and currency override
  let formattedValue: string;
  if (currency) {
    // Custom currency provided - format with decimals if specified
    if (decimals !== undefined) {
      const fixed = baseAmount.toFixed(decimals);
      formattedValue = `${parseFloat(fixed).toString()} ${currency}`;
    } else {
      // Use default decimals for the currency
      const defaultDecimals = currency === "B3" ? 0 : 2;
      const fixed = baseAmount.toFixed(defaultDecimals);
      formattedValue = `${parseFloat(fixed).toString()} ${currency}`;
    }
  } else if (decimals !== undefined && activeCurrency === "B3") {
    // Format with specified decimals for B3, then remove trailing zeros
    const fixed = baseAmount.toFixed(decimals);
    formattedValue = `${parseFloat(fixed).toString()} B3`;
  } else {
    // Use default formatting from hook for all other currencies (and B3 without custom decimals)
    formattedValue = formatCurrencyValue(baseAmount);
  }

  // Calculate tooltip value with dynamic decimal handling
  const getTooltipValue = () => {
    let baseTooltipValue = "";

    if (currency) {
      // Custom currency - show base currency equivalent in tooltip
      if (currency === baseCurrency) {
        const usdValue = exchangeRate ? Math.abs(amount) * exchangeRate : Math.abs(amount);
        let tooltipDecimals = 2;
        let formatted = usdValue.toFixed(tooltipDecimals);
        while (parseFloat(formatted) === 0 && usdValue > 0 && tooltipDecimals < 8) {
          tooltipDecimals++;
          formatted = usdValue.toFixed(tooltipDecimals);
        }
        baseTooltipValue = `$${formatted} USD`;
      } else {
        // Show as-is for other currencies, no conversion available
        baseTooltipValue = `${Math.abs(amount).toFixed(4)} ${currency}`;
      }
    } else if (activeCurrency === baseCurrency) {
      // Show USD equivalent when displaying base currency
      const usdValue = exchangeRate ? Math.abs(amount) * exchangeRate : Math.abs(amount);

      // Apply dynamic decimal handling for USD tooltip
      let tooltipDecimals = 2;
      let formatted = usdValue.toFixed(tooltipDecimals);
      while (parseFloat(formatted) === 0 && usdValue > 0 && tooltipDecimals < 8) {
        tooltipDecimals++;
        formatted = usdValue.toFixed(tooltipDecimals);
      }
      baseTooltipValue = `$${formatted} USD`;
    } else {
      // Show original base currency value when displaying other currencies
      const baseValue = Math.abs(amount);

      // Apply dynamic decimal handling for base currency tooltip
      let tooltipDecimals = baseCurrency === "B3" ? 0 : 2;
      let formatted = baseValue.toFixed(tooltipDecimals);
      while (parseFloat(formatted) === 0 && baseValue > 0 && tooltipDecimals < 8) {
        tooltipDecimals++;
        formatted = baseValue.toFixed(tooltipDecimals);
      }
      baseTooltipValue = `${formatted} ${baseCurrency}`;
    }

    // Add change indicator if needed
    if (showChange) {
      return `${isPositive ? "+" : "-"}${baseTooltipValue}`;
    }

    return baseTooltipValue;
  };

  const tooltipValue = getTooltipValue();

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
