import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCurrencyConversion } from "../useCurrencyConversion";

// Mock the external dependencies
// Store mock rates for different quote currencies
const mockRates: Record<string, number | undefined> = {};

// Mock store state
const mockStoreState: any = {
  selectedCurrency: "B3",
  baseCurrency: "B3",
  setSelectedCurrency: vi.fn(),
  setBaseCurrency: vi.fn(),
};

vi.mock("@b3dotfun/sdk/global-account/react", () => ({
  useExchangeRate: vi.fn((params: any) => {
    const rate = mockRates[params?.quoteCurrency];
    return { rate };
  }),
}));

vi.mock("@b3dotfun/sdk/shared/utils/number", () => ({
  formatDisplayNumber: vi.fn((value: any) => {
    const num = Number(value);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US", { maximumFractionDigits: 6 });
  }),
}));

vi.mock("../../stores/currencyStore", () => ({
  useCurrencyStore: vi.fn((selector: any) => {
    if (selector) {
      return selector(mockStoreState);
    }
    return mockStoreState;
  }),
  CURRENCY_SYMBOLS: {
    B3: "B3",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    ETH: "ETH",
    SOL: "SOL",
    KRW: "₩",
  },
}));

describe("useCurrencyConversion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock rates to default
    Object.keys(mockRates).forEach(key => delete mockRates[key]);
    mockRates.USD = 1.0;
    // Reset store state
    mockStoreState.selectedCurrency = "B3";
    mockStoreState.baseCurrency = "B3";
  });

  describe("formatCurrencyValue", () => {
    it("should format base currency (B3) without conversion", () => {
      mockStoreState.selectedCurrency = "B3";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toContain("B3");
      expect(formatted).toContain("100");
    });

    it("should show base currency when exchange rate is unavailable", () => {
      mockRates.USD = undefined;
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toContain("B3");
      expect(formatted).not.toContain("$");
    });

    it("should format USD with prefix symbol", () => {
      mockRates.USD = 2.0;
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toMatch(/^\$/);
      expect(formatted).toContain("200");
    });

    it("should format EUR with prefix symbol", () => {
      mockRates.EUR = 1.8;
      mockRates.USD = 2.0;
      mockStoreState.selectedCurrency = "EUR";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toMatch(/^€/);
    });

    it("should format JPY without decimals", () => {
      mockRates.JPY = 150;
      mockRates.USD = 2.0;
      mockStoreState.selectedCurrency = "JPY";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toContain("¥");
      expect(formatted).not.toContain(".");
    });

    it("should format KRW without decimals", () => {
      mockRates.KRW = 1300;
      mockRates.USD = 2.0;
      mockStoreState.selectedCurrency = "KRW";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toContain("₩");
      expect(formatted).not.toContain(".");
    });

    it("should format ETH with suffix symbol", () => {
      mockRates.ETH = 0.0005;
      mockRates.USD = 2.0;
      mockStoreState.selectedCurrency = "ETH";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toContain("ETH");
      expect(formatted).not.toMatch(/^ETH/);
    });

    it("should format SOL with suffix symbol", () => {
      mockRates.SOL = 0.05;
      mockRates.USD = 2.0;
      mockStoreState.selectedCurrency = "SOL";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(100, "B3");

      expect(formatted).toContain("SOL");
      expect(formatted).not.toMatch(/^SOL/);
    });

    it("should handle small USD amounts with proper conversion", () => {
      mockRates.USD = 1.5;
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const formatted = result.current.formatCurrencyValue(10, "B3");

      // 10 * 1.5 = 15
      expect(formatted).toMatch(/^\$/);
      expect(formatted).toContain("15");
    });

    it("should apply correct exchange rate conversion", () => {
      const testRate = 3.5;
      mockRates.USD = testRate;
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const inputValue = 100;
      const formatted = result.current.formatCurrencyValue(inputValue, "B3");

      expect(formatted).toContain("350");
    });
  });

  describe("return values", () => {
    it("should return selected currency", () => {
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());

      expect(result.current.selectedCurrency).toBe("USD");
    });

    it("should return base currency", () => {
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());

      expect(result.current.baseCurrency).toBe("B3");
    });

    it("should return exchange rate", () => {
      const testRate = 2.5;
      mockRates.USD = testRate;
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());

      expect(result.current.exchangeRate).toBe(testRate);
    });

    it("should return correct currency symbols", () => {
      mockStoreState.selectedCurrency = "EUR";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());

      expect(result.current.selectedCurrencySymbol).toBe("€");
      expect(result.current.baseCurrencySymbol).toBe("B3");
    });
  });

  describe("formatTooltipValue", () => {
    it("should show USD equivalent when displaying base currency", () => {
      mockRates.USD = 1.5;
      mockStoreState.selectedCurrency = "B3";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const tooltip = result.current.formatTooltipValue(100, "B3");

      expect(tooltip).toContain("USD");
      expect(tooltip).toContain("150");
    });

    it("should show base currency when displaying other currency", () => {
      mockRates.EUR = 0.9;
      mockRates.USD = 1.2;
      mockStoreState.selectedCurrency = "EUR";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const tooltip = result.current.formatTooltipValue(100, "B3");

      expect(tooltip).toContain("B3");
      expect(tooltip).toContain("100");
    });

    it("should handle custom currency for base currency", () => {
      mockRates.USD = 2.0;
      mockRates.EUR = 1.8;
      mockStoreState.selectedCurrency = "EUR";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const tooltip = result.current.formatTooltipValue(100, "B3");

      expect(tooltip).toContain("USD");
      expect(tooltip).toContain("200");
    });

    it("should handle custom currency for non-base currency", () => {
      mockRates.USD = 2.0;
      mockStoreState.selectedCurrency = "USD";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const tooltip = result.current.formatTooltipValue(50, "ETH");

      expect(tooltip).toContain("ETH");
      expect(tooltip).toContain("50");
    });

    it("should handle absolute values for negative amounts", () => {
      mockRates.USD = 1.5;
      mockStoreState.selectedCurrency = "B3";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const tooltip = result.current.formatTooltipValue(-100, "B3");

      expect(tooltip).toContain("USD");
      expect(tooltip).toContain("150");
      expect(tooltip).not.toContain("-");
    });

    it("should handle exchange rate unavailable", () => {
      mockRates.USD = undefined;
      mockStoreState.selectedCurrency = "B3";
      mockStoreState.baseCurrency = "B3";

      const { result } = renderHook(() => useCurrencyConversion());
      const tooltip = result.current.formatTooltipValue(100, "B3");

      expect(tooltip).toContain("USD");
      expect(tooltip).toContain("100");
    });
  });
});
