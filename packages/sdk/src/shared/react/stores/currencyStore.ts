import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Built-in supported currencies for display and conversion.
 * Includes fiat currencies (USD, EUR, GBP, JPY, CAD, AUD, KRW) and crypto (ETH, SOL, B3).
 */
export type SupportedCurrency = "ETH" | "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD" | "B3" | "SOL" | "KRW";

/**
 * Metadata for a custom currency including display formatting rules.
 */
export interface CurrencyMetadata {
  /** The currency code/symbol (e.g., "BTC", "DOGE") */
  code: string;
  /** Display symbol for the currency (e.g., "₿", "Ð") */
  symbol: string;
  /** Human-readable name (e.g., "Bitcoin", "Dogecoin") */
  name: string;
  /** Whether to show symbol before the value (true for $100, false for 100 ETH) */
  prefixSymbol?: boolean;
  /** Number of decimal places to show (undefined uses smart formatting) */
  decimals?: number;
  /** Whether to use subscript notation for small values */
  showSubscripts?: boolean;
}

/**
 * Exchange rate between two currencies.
 */
export interface ExchangeRate {
  /** Currency code being converted from */
  from: string;
  /** Currency code being converted to */
  to: string;
  /** Exchange rate multiplier (amount_in_to = amount_in_from * rate) */
  rate: number;
}

/**
 * Currency symbols used for display formatting.
 * Prefix currencies (USD, EUR, GBP, CAD, AUD) show symbol before the amount.
 * Suffix currencies (JPY, KRW, ETH, SOL, B3) show symbol after the amount.
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  ETH: "ETH",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  B3: "B3",
  SOL: "SOL",
  KRW: "₩",
};

/**
 * Human-readable currency names for display in selectors and labels.
 */
export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  ETH: "Ethereum",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  B3: "B3",
  SOL: "Solana",
  KRW: "Korean Won",
};

/**
 * Currency store state interface.
 * @property selectedCurrency - The currency currently selected for display
 * @property baseCurrency - The base currency for conversion (typically B3)
 * @property customCurrencies - Map of custom currency codes to their metadata
 * @property customExchangeRates - Map of "FROM-TO" pairs to exchange rates
 * @property setSelectedCurrency - Update the selected display currency
 * @property setBaseCurrency - Update the base currency for conversions
 * @property addCurrency - Register a new custom currency with metadata
 * @property removeCurrency - Remove a custom currency
 * @property setExchangeRate - Set a custom exchange rate between two currencies
 * @property getExchangeRate - Get exchange rate between two currencies
 * @property getAllCurrencies - Get all available currencies (built-in + custom)
 */
interface CurrencyState {
  selectedCurrency: string;
  baseCurrency: string;
  customCurrencies: Record<string, CurrencyMetadata>;
  customExchangeRates: Record<string, number>;
  setSelectedCurrency: (currency: string) => void;
  setBaseCurrency: (currency: string) => void;
  addCurrency: (metadata: CurrencyMetadata) => void;
  removeCurrency: (code: string) => void;
  setExchangeRate: (from: string, to: string, rate: number) => void;
  getExchangeRate: (from: string, to: string) => number | undefined;
  getAllCurrencies: () => string[];
}

/**
 * Zustand store for managing currency selection and conversion.
 * Persists user's selected currency preference in localStorage.
 * Supports dynamic currency registration and custom exchange rates.
 *
 * @example
 * ```tsx
 * const { selectedCurrency, setSelectedCurrency, addCurrency, setExchangeRate } = useCurrencyStore();
 *
 * // Add a new currency
 * addCurrency({
 *   code: "BTC",
 *   symbol: "₿",
 *   name: "Bitcoin",
 *   showSubscripts: true,
 * });
 *
 * // Set exchange rate: 1 BTC = 50000 USD
 * setExchangeRate("BTC", "USD", 50000);
 *
 * // Change display currency
 * setSelectedCurrency('BTC');
 * ```
 */
export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      selectedCurrency: "B3",
      baseCurrency: "B3",
      customCurrencies: {},
      customExchangeRates: {},

      setSelectedCurrency: currency => set({ selectedCurrency: currency }),

      setBaseCurrency: currency => set({ baseCurrency: currency }),

      addCurrency: metadata => {
        set(state => ({
          customCurrencies: {
            ...state.customCurrencies,
            [metadata.code]: metadata,
          },
        }));
      },

      removeCurrency: code => {
        set(state => {
          // Remove the currency
          const customCurrencies = state.customCurrencies;

          const remaining = Object.fromEntries(Object.entries(customCurrencies).filter(([key]) => key !== code));

          // Remove all exchange rates involving this currency
          const filteredRates: Record<string, number> = {};
          for (const [key, rate] of Object.entries(state.customExchangeRates)) {
            // Key format is "FROM-TO", skip if either matches the removed code
            const [from, to] = key.split("-");
            if (from !== code && to !== code) {
              filteredRates[key] = rate;
            }
          }

          return {
            customCurrencies: remaining,
            customExchangeRates: filteredRates,
          };
        });
      },

      setExchangeRate: (from, to, rate) => {
        set(state => {
          const key = `${from}-${to}`;
          const inverseKey = `${to}-${from}`;

          // Only set inverse rate if rate is not 0 (to avoid Infinity)
          const newRates: Record<string, number> = {
            ...state.customExchangeRates,
            [key]: rate,
          };

          if (rate !== 0) {
            newRates[inverseKey] = 1 / rate;
          }

          return {
            customExchangeRates: newRates,
          };
        });
      },

      getExchangeRate: (from, to) => {
        const key = `${from}-${to}`;
        return get().customExchangeRates[key];
      },

      getAllCurrencies: () => {
        const builtIn = Object.keys(CURRENCY_SYMBOLS);
        const custom = Object.keys(get().customCurrencies);
        return [...builtIn, ...custom];
      },
    }),
    {
      name: "currency-storage",
      version: 3,
    },
  ),
);

/**
 * Get the symbol for any currency (built-in or custom).
 */
export function getCurrencySymbol(currency: string): string {
  // Check built-in currencies first
  if (currency in CURRENCY_SYMBOLS) {
    return CURRENCY_SYMBOLS[currency as SupportedCurrency];
  }

  // Check custom currencies
  const customCurrencies = useCurrencyStore.getState().customCurrencies;
  const customCurrency = customCurrencies[currency];
  if (customCurrency) {
    return customCurrency.symbol;
  }

  // Fallback to currency code
  return currency;
}

/**
 * Get the name for any currency (built-in or custom).
 */
export function getCurrencyName(currency: string): string {
  // Check built-in currencies first
  if (currency in CURRENCY_NAMES) {
    return CURRENCY_NAMES[currency as SupportedCurrency];
  }

  // Check custom currencies
  const customCurrencies = useCurrencyStore.getState().customCurrencies;
  const customCurrency = customCurrencies[currency];
  if (customCurrency) {
    return customCurrency.name;
  }

  // Fallback to currency code
  return currency;
}

/**
 * Get metadata for a custom currency.
 */
export function getCurrencyMetadata(currency: string): CurrencyMetadata | undefined {
  const customCurrencies = useCurrencyStore.getState().customCurrencies;
  return customCurrencies[currency];
}

/**
 * Get the number of decimal places for a currency (for converting from smallest unit).
 * Used when parsing amounts from wei/smallest unit format.
 *
 * @param currency - Currency code
 * @returns Number of decimal places (e.g., 18 for ETH/wei, 2 for USD cents, 0 for JPY)
 */
export function getCurrencyDecimalPlaces(currency: string): number {
  // Check custom currencies first
  const customCurrencies = useCurrencyStore.getState().customCurrencies;
  const customMetadata = customCurrencies[currency];
  if (customMetadata?.decimals !== undefined) {
    return customMetadata.decimals;
  }

  // Built-in currencies with 18 decimals (wei-like)
  if (currency === "WIN" || currency === "ETH" || currency === "SOL" || currency === "B3") {
    return 18;
  }

  // Fiat currencies with cent-like decimals
  if (currency === "USD" || currency === "EUR" || currency === "GBP" || currency === "CAD" || currency === "AUD") {
    return 2;
  }

  // Currencies without fractional units
  if (currency === "JPY" || currency === "KRW") {
    return 0;
  }

  // Default to 18 decimals (wei-like)
  return 18;
}
