import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SupportedCurrency = "ETH" | "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD" | "B3" | "SOL" | "KRW";

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

interface CurrencyState {
  selectedCurrency: SupportedCurrency;
  baseCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  setBaseCurrency: (currency: SupportedCurrency) => void;
}

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
      version: 2, // Increment version for the new field
    },
  ),
);
