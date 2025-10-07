import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Supported currencies for display and conversion.
 * Includes fiat currencies (USD, EUR, GBP, JPY, CAD, AUD, KRW) and crypto (ETH, SOL, B3).
 */
export type SupportedCurrency = "ETH" | "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD" | "B3" | "SOL" | "KRW";

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
 * @property setSelectedCurrency - Update the selected display currency
 * @property setBaseCurrency - Update the base currency for conversions
 */
interface CurrencyState {
  selectedCurrency: SupportedCurrency;
  baseCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  setBaseCurrency: (currency: SupportedCurrency) => void;
}

/**
 * Zustand store for managing currency selection and conversion.
 * Persists user's selected currency preference in localStorage.
 *
 * @example
 * ```tsx
 * const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
 * // Change display currency to USD
 * setSelectedCurrency('USD');
 * ```
 */
export const useCurrencyStore = create<CurrencyState>()(
  persist(
    set => ({
      selectedCurrency: "B3",
      baseCurrency: "B3",
      setSelectedCurrency: currency => set({ selectedCurrency: currency }),
      setBaseCurrency: currency => set({ baseCurrency: currency }),
    }),
    {
      name: "currency-storage",
      version: 2,
    },
  ),
);
