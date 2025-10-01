import { useExchangeRate } from "@b3dotfun/sdk/global-account/react";
import { formatNumberWithAbbreviations } from "@b3dotfun/sdk/shared/utils/formatNumberWithAbbreviations";
import { CURRENCY_SYMBOLS, useCurrencyStore } from "../stores/currencyStore";

export function useCurrencyConversion() {
  const selectedCurrency = useCurrencyStore(state => state.selectedCurrency);
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  // Use the real exchange rate hook from the SDK
  // If selected currency is same as base, get USD rate for tooltip conversion
  const { rate: exchangeRate } = useExchangeRate({
    baseCurrency,
    quoteCurrency: selectedCurrency === baseCurrency ? "USD" : selectedCurrency,
  });

  const formatCurrencyValue = (value: number): string => {
    // If no exchange rate available, show base currency
    if (selectedCurrency === baseCurrency || !exchangeRate) {
      // For base currency, handle small amounts that might round to 0
      let decimals = baseCurrency === "B3" ? 0 : 2;
      let formatted = formatNumberWithAbbreviations(value, decimals, true);

      // If the value rounds to "0" but the original value is not 0, increase decimals
      while (formatted === "0" && value > 0 && decimals < 8) {
        decimals++;
        formatted = formatNumberWithAbbreviations(value, decimals, true);
      }

      return `${formatted} ${baseCurrency}`;
    }

    const convertedValue = value * exchangeRate;
    const symbol = CURRENCY_SYMBOLS[selectedCurrency];

    // For fiat currencies that need guaranteed decimal places
    const fiatCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
    const prefixCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

    let formatted: string;

    if (selectedCurrency === "JPY" || selectedCurrency === "KRW") {
      // No decimals for JPY and KRW, but handle small amounts
      let decimals = 0;
      formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
      while (formatted === "0" && convertedValue > 0 && decimals < 4) {
        decimals++;
        formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
      }
    } else if (selectedCurrency === "ETH" || selectedCurrency === "SOL") {
      // More decimals for crypto, but ensure we don't round small amounts to 0
      let decimals = 6;
      formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
      while (formatted === "0" && convertedValue > 0 && decimals < 12) {
        decimals++;
        formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
      }
    } else if (fiatCurrencies.includes(selectedCurrency)) {
      // For fiat currencies, ensure at least 2 decimal places for amounts < 1000
      if (convertedValue < 1000) {
        let decimals = 2;
        formatted = convertedValue.toFixed(decimals);
        // If rounds to 0.00, increase decimal places
        while (parseFloat(formatted) === 0 && convertedValue > 0 && decimals < 8) {
          decimals++;
          formatted = convertedValue.toFixed(decimals);
        }
      } else {
        let decimals = 2;
        formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
        while (formatted === "0" && convertedValue > 0 && decimals < 6) {
          decimals++;
          formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
        }
      }
    } else {
      // Default formatting with dynamic decimal handling
      let decimals = 2;
      formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
      while (formatted === "0" && convertedValue > 0 && decimals < 8) {
        decimals++;
        formatted = formatNumberWithAbbreviations(convertedValue, decimals, true);
      }
    }

    if (prefixCurrencies.includes(selectedCurrency)) {
      return `${symbol}${formatted}`;
    } else {
      // Suffix currencies (after the number): JPY, KRW, ETH, SOL, B3
      return `${formatted} ${symbol}`;
    }
  };

  return {
    selectedCurrency,
    baseCurrency,
    exchangeRate,
    formatCurrencyValue,
    selectedCurrencySymbol: CURRENCY_SYMBOLS[selectedCurrency],
    baseCurrencySymbol: CURRENCY_SYMBOLS[baseCurrency],
  };
}
