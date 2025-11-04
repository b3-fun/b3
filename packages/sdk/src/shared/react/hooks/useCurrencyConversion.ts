import { useQuery } from "@tanstack/react-query";
import { formatDisplayNumber } from "@b3dotfun/sdk/shared/utils/number";
import { useCurrencyStore, getCurrencySymbol, getCurrencyMetadata } from "../stores/currencyStore";

const COINBASE_API_URL = "https://api.coinbase.com/v2/exchange-rates";
const REFETCH_INTERVAL_MS = 30000;

interface CoinbaseExchangeRatesResponse {
  data: {
    currency: string;
    rates: Record<string, string>;
  };
}

/**
 * Fetches all exchange rates for a given base currency from Coinbase API.
 */
async function fetchAllExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  const response = await fetch(`${COINBASE_API_URL}?currency=${baseCurrency}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates for ${baseCurrency}: ${response.status}`);
  }
  const data: CoinbaseExchangeRatesResponse = await response.json();
  const rates: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(data.data.rates)) {
    rates[currency] = parseFloat(rate);
  }
  return rates;
}

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
  const getCustomExchangeRate = useCurrencyStore(state => state.getExchangeRate);
  const customCurrencies = useCurrencyStore(state => state.customCurrencies);

  // Fetch all exchange rates for the base currency from Coinbase API
  const { data: apiExchangeRates } = useQuery({
    queryKey: ["exchangeRates", baseCurrency],
    queryFn: () => fetchAllExchangeRates(baseCurrency),
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: REFETCH_INTERVAL_MS / 2,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, REFETCH_INTERVAL_MS),
  });

  /**
   * Get exchange rate between two currencies, checking custom rates first, then API rates.
   * Supports chaining through base currency for custom currencies.
   *
   * Examples:
   * - WIN → USD: Checks WIN→USD custom rate, then chains WIN→B3→USD
   * - BTC → EUR: Checks BTC→EUR custom rate, then chains BTC→B3→EUR
   */
  const getExchangeRate = (from: string, to: string): number | undefined => {
    // If same currency, rate is 1
    if (from === to) return 1;

    // 1. Check direct custom exchange rate first
    const directCustomRate = getCustomExchangeRate(from, to);
    if (directCustomRate !== undefined) {
      return directCustomRate;
    }

    // 2. Check direct API rate (from base currency)
    if (from === baseCurrency && apiExchangeRates) {
      return apiExchangeRates[to];
    }

    // 3. Try to chain through base currency using custom rates
    // e.g., WIN → B3 → USD (where WIN→B3 is custom, B3→USD is API)
    const customFromToBase = getCustomExchangeRate(from, baseCurrency);
    if (customFromToBase !== undefined) {
      // We have a custom rate from 'from' to base
      // Now get rate from base to 'to'
      const baseToTo = apiExchangeRates?.[to] ?? getCustomExchangeRate(baseCurrency, to);
      if (baseToTo !== undefined) {
        return customFromToBase * baseToTo;
      }
    }

    // 4. Try reverse: chain from base currency through custom rate
    // e.g., USD → B3 → WIN (where B3→WIN is custom)
    const customBaseToTo = getCustomExchangeRate(baseCurrency, to);
    if (customBaseToTo !== undefined && apiExchangeRates) {
      // We have a custom rate from base to 'to'
      // Now get rate from 'from' to base
      const fromToBase = apiExchangeRates[from];
      if (fromToBase !== undefined && fromToBase !== 0) {
        return fromToBase * customBaseToTo;
      }
    }

    // 5. Fall back to pure API conversion through base
    // e.g., EUR to GBP = (EUR to B3) * (B3 to GBP)
    if (apiExchangeRates) {
      const fromToBase = apiExchangeRates[from];
      const baseToTo = apiExchangeRates[to];
      if (fromToBase && baseToTo && fromToBase !== 0) {
        return baseToTo / fromToBase;
      }
    }

    return undefined;
  };

  // Extract specific rates
  const exchangeRate = getExchangeRate(baseCurrency, selectedCurrency);

  /**
   * Formats a numeric value as a currency string with automatic conversion.
   *
   * New behavior:
   * - Takes the SOURCE currency (what the value is in) as a required parameter
   * - Automatically converts from source → display currency (selected in picker)
   * - Supports multi-hop conversions (e.g., WIN → B3 → USD)
   * - Applies currency-specific formatting rules to the TARGET currency
   *
   * @param value - The numeric value to format
   * @param sourceCurrency - The currency the value is currently in (e.g., "WIN", "B3", "USD")
   * @param options - Optional formatting overrides
   * @param options.decimals - Override number of decimal places for display
   * @returns Formatted currency string with appropriate symbol and decimal places
   *
   * @example
   * ```tsx
   * // Value is 3031 WIN, user has USD selected
   * formatCurrencyValue(3031, "WIN") // Returns "$30.31" (converts WIN→B3→USD)
   *
   * // Value is 100 B3, user has B3 selected (no conversion)
   * formatCurrencyValue(100, "B3") // Returns "100 B3"
   *
   * // Value is 50 USD, user has EUR selected
   * formatCurrencyValue(50, "USD") // Returns "€45.50" (converts USD→EUR)
   * ```
   */
  const formatCurrencyValue = (value: number, sourceCurrency: string, options?: { decimals?: number }): string => {
    const overrideDecimals = options?.decimals;

    // If source and display currency are the same, no conversion needed
    if (sourceCurrency === selectedCurrency) {
      const customMetadata = getCurrencyMetadata(sourceCurrency);
      const decimalsToUse = overrideDecimals !== undefined ? overrideDecimals : customMetadata?.decimals;

      const formatted = formatDisplayNumber(value, {
        fractionDigits: decimalsToUse,
        significantDigits: decimalsToUse === undefined ? 6 : undefined,
        showSubscripts: customMetadata?.showSubscripts ?? false,
      });

      const symbol = getCurrencySymbol(sourceCurrency);
      const usePrefix = customMetadata?.prefixSymbol ?? ["USD", "EUR", "GBP", "CAD", "AUD"].includes(sourceCurrency);

      return usePrefix ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
    }

    // Get exchange rate from source to display currency
    const conversionRate = getExchangeRate(sourceCurrency, selectedCurrency);

    // If no conversion rate available, display in source currency
    if (conversionRate === undefined) {
      const customMetadata = getCurrencyMetadata(sourceCurrency);
      const formatted = formatDisplayNumber(value, {
        significantDigits: 6,
        showSubscripts: customMetadata?.showSubscripts ?? false,
      });
      const symbol = getCurrencySymbol(sourceCurrency);
      return `${formatted} ${symbol}`;
    }

    // Convert value
    const convertedValue = value * conversionRate;

    // Get symbol and metadata for display currency
    const symbol = getCurrencySymbol(selectedCurrency);
    const customMetadata = getCurrencyMetadata(selectedCurrency);
    const usePrefix = customMetadata?.prefixSymbol ?? ["USD", "EUR", "GBP", "CAD", "AUD"].includes(selectedCurrency);

    let formatted: string;

    // Apply formatting based on display currency
    if (overrideDecimals !== undefined) {
      formatted = formatDisplayNumber(convertedValue, {
        fractionDigits: overrideDecimals,
        showSubscripts: false,
      });
    } else if (customMetadata) {
      formatted = formatDisplayNumber(convertedValue, {
        fractionDigits: customMetadata.decimals,
        significantDigits: customMetadata.decimals === undefined ? 6 : undefined,
        showSubscripts: customMetadata.showSubscripts ?? false,
      });
    } else if (selectedCurrency === "JPY" || selectedCurrency === "KRW") {
      formatted = formatDisplayNumber(convertedValue, {
        fractionDigits: 0,
        showSubscripts: false,
      });
    } else if (selectedCurrency === "ETH" || selectedCurrency === "SOL") {
      formatted = formatDisplayNumber(convertedValue, {
        significantDigits: 6,
        showSubscripts: true,
      });
    } else {
      formatted = formatDisplayNumber(convertedValue, {
        significantDigits: 6,
        fractionDigits: convertedValue < 1000 ? 2 : undefined,
        showSubscripts: true,
      });
    }

    return usePrefix ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
  };

  /**
   * Formats a tooltip value showing the alternate currency representation.
   *
   * New behavior:
   * - Takes the SOURCE currency (what the value is in)
   * - When displaying in non-USD: Shows USD equivalent in tooltip
   * - When displaying in USD: Shows source currency in tooltip
   *
   * @param value - The numeric value to format
   * @param sourceCurrency - The currency the value is currently in
   * @returns Formatted tooltip string
   *
   * @example
   * ```tsx
   * // Value is 3031 WIN, displaying as EUR
   * formatTooltipValue(3031, "WIN") // Returns "$30.31 USD"
   *
   * // Value is 100 B3, displaying as USD
   * formatTooltipValue(100, "B3") // Returns "100 B3"
   * ```
   */
  const formatTooltipValue = (value: number, sourceCurrency: string): string => {
    const absoluteValue = Math.abs(value);

    // If displaying in USD, show source currency in tooltip
    if (selectedCurrency === "USD") {
      const formatted = formatDisplayNumber(absoluteValue, {
        significantDigits: 6,
        showSubscripts: getCurrencyMetadata(sourceCurrency)?.showSubscripts ?? false,
      });
      const symbol = getCurrencySymbol(sourceCurrency);
      return `${formatted} ${symbol}`;
    }

    // Otherwise, show USD equivalent in tooltip
    const usdRate = getExchangeRate(sourceCurrency, "USD");
    if (usdRate === undefined) {
      // Fallback to source currency if no USD rate
      const formatted = formatDisplayNumber(absoluteValue, {
        significantDigits: 6,
        showSubscripts: getCurrencyMetadata(sourceCurrency)?.showSubscripts ?? false,
      });
      const symbol = getCurrencySymbol(sourceCurrency);
      return `${formatted} ${symbol}`;
    }

    const usdValue = absoluteValue * usdRate;
    const formatted = formatDisplayNumber(usdValue, {
      significantDigits: 6,
      fractionDigits: usdValue < 1000 ? 2 : undefined,
      showSubscripts: true,
    });
    return `$${formatted} USD`;
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
    selectedCurrencySymbol: getCurrencySymbol(selectedCurrency),
    /** Symbol for the base currency */
    baseCurrencySymbol: getCurrencySymbol(baseCurrency),
    /** Get exchange rate between any two currencies */
    getExchangeRate,
    /** All registered custom currencies */
    customCurrencies,
  };
}
