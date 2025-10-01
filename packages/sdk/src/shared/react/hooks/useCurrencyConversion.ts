import { useExchangeRate } from "@b3dotfun/sdk/global-account/react";
import { formatDisplayNumber } from "@b3dotfun/sdk/shared/utils/number";
import { CURRENCY_SYMBOLS, useCurrencyStore } from "../stores/currencyStore";

/**
 * Hook for currency conversion and formatting with real-time exchange rates.
 *
 * This hook provides currency conversion functionality using live exchange rates
 * and formats values according to currency-specific rules (decimals, symbols, etc.).
 *
 * @returns Currency conversion utilities and state
 *
 * @example
 * ```tsx
 * function PriceDisplay({ amount }: { amount: number }) {
 *   const { formatCurrencyValue, selectedCurrency } = useCurrencyConversion();
 *   return <div>{formatCurrencyValue(amount)}</div>;
 * }
 * ```
 */
export function useCurrencyConversion() {
  const selectedCurrency = useCurrencyStore(state => state.selectedCurrency);
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  // Get exchange rate for the selected currency
  const { rate: exchangeRate } = useExchangeRate({
    baseCurrency,
    quoteCurrency: selectedCurrency === baseCurrency ? "USD" : selectedCurrency,
  });

  // Always fetch USD rate for tooltip purposes
  const { rate: usdRate } = useExchangeRate({
    baseCurrency,
    quoteCurrency: "USD",
  });

  /**
   * Formats a numeric value as a currency string with proper conversion and formatting.
   *
   * Behavior:
   * - When exchange rate is unavailable, displays value in base currency
   * - Applies currency-specific formatting rules:
   *   - JPY/KRW: No decimal places
   *   - ETH/SOL: 6 significant digits with subscript notation for small values
   *   - Fiat (USD/EUR/GBP/CAD/AUD): 2 decimal places minimum for values < 1000
   * - Handles symbol positioning (prefix for fiat, suffix for crypto)
   *
   * @param value - The numeric value to format (in base currency)
   * @param options - Optional formatting overrides
   * @param options.decimals - Override number of decimal places
   * @param options.currency - Override currency (bypasses conversion)
   * @returns Formatted currency string with appropriate symbol and decimal places
   *
   * @example
   * ```tsx
   * formatCurrencyValue(100) // Returns "$100.00" if USD is selected
   * formatCurrencyValue(0.0001) // Returns "0.0₄1 ETH" if ETH is selected
   * formatCurrencyValue(1500) // Returns "¥1,500" if JPY is selected
   * formatCurrencyValue(100, { decimals: 4, currency: "ETH" }) // Returns "100.0000 ETH"
   * ```
   */
  const formatCurrencyValue = (value: number, options?: { decimals?: number; currency?: string }): string => {
    const overrideCurrency = options?.currency;
    const overrideDecimals = options?.decimals;

    // Custom currency provided - bypass conversion and use simple formatting
    if (overrideCurrency) {
      const decimalsToUse = overrideDecimals !== undefined ? overrideDecimals : overrideCurrency === "B3" ? 0 : 2;

      const formatted = formatDisplayNumber(value, {
        fractionDigits: decimalsToUse,
        showSubscripts: false,
      });
      return `${formatted} ${overrideCurrency}`;
    }

    // Custom decimals for base currency without conversion
    if (overrideDecimals !== undefined && selectedCurrency === baseCurrency) {
      const formatted = formatDisplayNumber(value, {
        fractionDigits: overrideDecimals,
        showSubscripts: false,
      });
      return `${formatted} ${baseCurrency}`;
    }

    // If no exchange rate available, show base currency to prevent showing
    // incorrect values with wrong currency symbols during rate fetching
    if (selectedCurrency === baseCurrency || !exchangeRate) {
      const formatted = formatDisplayNumber(value, {
        significantDigits: baseCurrency === "B3" ? 6 : 8,
        showSubscripts: true,
      });
      return `${formatted} ${baseCurrency}`;
    }

    // Convert value using current exchange rate
    const convertedValue = value * exchangeRate;
    const symbol = CURRENCY_SYMBOLS[selectedCurrency];

    // Currencies that display symbol before the number (e.g., $100.00)
    const prefixCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

    let formatted: string;

    if (selectedCurrency === "JPY" || selectedCurrency === "KRW") {
      // Japanese Yen and Korean Won don't use decimal places
      formatted = formatDisplayNumber(convertedValue, {
        fractionDigits: 0,
        showSubscripts: false,
      });
    } else if (selectedCurrency === "ETH" || selectedCurrency === "SOL") {
      // Crypto currencies use more precision and subscript notation
      // for very small amounts (e.g., 0.0₃45 ETH)
      formatted = formatDisplayNumber(convertedValue, {
        significantDigits: 6,
        showSubscripts: true,
      });
    } else {
      // Standard fiat currencies (USD, EUR, GBP, CAD, AUD)
      // Use 2 decimal places minimum for amounts under 1000
      formatted = formatDisplayNumber(convertedValue, {
        significantDigits: 6,
        fractionDigits: convertedValue < 1000 ? 2 : undefined,
        showSubscripts: true,
      });
    }

    // Apply currency symbol with correct positioning
    if (prefixCurrencies.includes(selectedCurrency)) {
      return `${symbol}${formatted}`;
    } else {
      // Suffix currencies: JPY, KRW, ETH, SOL, B3
      return `${formatted} ${symbol}`;
    }
  };

  /**
   * Formats a tooltip value showing the alternate currency representation.
   *
   * Behavior:
   * - When displaying base currency: Shows USD equivalent
   * - When displaying other currency: Shows base currency equivalent
   * - For custom currencies: Shows appropriate conversion or original value
   *
   * @param value - The numeric value to format
   * @param customCurrency - Optional custom currency override
   * @returns Formatted tooltip string
   *
   * @example
   * ```tsx
   * formatTooltipValue(100) // Returns "$150.00 USD" if displaying B3 with rate 1.5
   * formatTooltipValue(100, "ETH") // Returns "100.0000 ETH" if custom currency
   * ```
   */
  const formatTooltipValue = (value: number, customCurrency?: string): string => {
    const displayCurrency = customCurrency || selectedCurrency;
    const absoluteValue = Math.abs(value);

    // Custom currency provided
    if (customCurrency) {
      if (customCurrency === baseCurrency) {
        // Show USD equivalent for base currency using USD rate
        const usdValue = usdRate ? absoluteValue * usdRate : absoluteValue;
        const formatted = formatDisplayNumber(usdValue, {
          significantDigits: 6,
          fractionDigits: usdValue < 1000 ? 2 : undefined,
          showSubscripts: true,
        });
        return `$${formatted} USD`;
      } else {
        // Show as-is for other custom currencies
        return `${formatDisplayNumber(absoluteValue, { significantDigits: 6 })} ${customCurrency}`;
      }
    }

    // Showing base currency - display USD equivalent
    if (displayCurrency === baseCurrency) {
      const usdValue = usdRate ? absoluteValue * usdRate : absoluteValue;
      const formatted = formatDisplayNumber(usdValue, {
        significantDigits: 6,
        fractionDigits: usdValue < 1000 ? 2 : undefined,
        showSubscripts: true,
      });
      return `$${formatted} USD`;
    }

    // Showing other currency - display base currency equivalent
    const formatted = formatDisplayNumber(absoluteValue, {
      significantDigits: baseCurrency === "B3" ? 6 : 8,
      showSubscripts: true,
    });
    return `${formatted} ${baseCurrency}`;
  };

  return {
    /** Currently selected display currency */
    selectedCurrency,
    /** Base currency used for conversion (typically B3) */
    baseCurrency,
    /** Current exchange rate from base to selected currency (undefined while loading) */
    exchangeRate,
    /** Format a value with currency conversion and proper symbol/decimal handling */
    formatCurrencyValue,
    /** Format a tooltip value showing alternate currency representation */
    formatTooltipValue,
    /** Symbol for the currently selected currency (e.g., "$", "€", "ETH") */
    selectedCurrencySymbol: CURRENCY_SYMBOLS[selectedCurrency],
    /** Symbol for the base currency */
    baseCurrencySymbol: CURRENCY_SYMBOLS[baseCurrency],
  };
}
