import React, { useContext, useEffect, useRef, useState } from "react";

// Import proper TradingView types and widget from the source directory
import type {
  ChartingLibraryWidgetOptions,
  IBasicDataFeed,
  IChartingLibraryWidget,
  ResolutionString,
  Timezone,
} from "../../../public/static/charting_library/charting_library";

import Big from "big.js";

// Import the widget constructor
import { widget as Widget } from "../../../public/static/charting_library/charting_library.esm";

// Import UDF datafeed
import { UDFCompatibleDatafeed } from "../../../public/static/datafeeds/udf/src/udf-compatible-datafeed";

// Mock loading overlay - replace with your actual loading component
const GifLoadingOverlay = ({ className }: { className?: string }) => (
  <div
    className={`flex items-center justify-center bg-gray-900/50 ${
      className || ""
    }`}
  >
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
);

// Mock window context - replace with your actual context
const WindowContext = React.createContext({ isMobileMode: false });

const TradingView = ({
  className,
  tokenAddress,
  tokenSymbol,
}: {
  className?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
}) => {
  // Mock theme - you can integrate with your actual theme system
  const theme = "dark";

  // Use token info for the current trade
  const currentTrade = {
    product_id:
      tokenAddress && tokenSymbol
        ? `${tokenSymbol}-${tokenAddress}`
        : "BONDKIT",
  };

  // Mock config state - replace with your actual state management
  const [tradingViewDefaultInterval, setTradingViewDefaultInterval] =
    useState<ResolutionString>("60" as ResolutionString);
  const [tradingViewTimezone, setTradingViewTimezone] = useState<string>("");

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const { isMobileMode } = useContext(WindowContext);
  const isChangingInterval = useRef(false);

  function getSubscript(leadingZeroes: string) {
    const length = leadingZeroes.length;
    if (length === 0) {
      return "";
    }
    if (length <= 9) {
      return String.fromCharCode(0x2080 + length);
    } else {
      // For numbers 10 and above, combine individual subscript digits
      return length
        .toString()
        .split("")
        .map((digit) => String.fromCharCode(0x2080 + parseInt(digit)))
        .join("");
    }
  }
  const formatNumber = (number: number | string | null, short?: boolean) => {
    if (number == 0) {
      return "0";
    }
    if (!number) {
      return "";
    }

    const isNegative = Big(number).lt(0);
    let numStr = Big(number).abs().toFixed();
    let decimalPart = numStr.split(".")[1];
    const negativeStr = isNegative ? "-" : "";

    if (Number(numStr) < 0.0001 && decimalPart) {
      const leadingZeroes = decimalPart.match(/^0+/)?.[0] ?? "";
      const tailPart = decimalPart.slice(leadingZeroes.length).slice(0, 4);
      // display leading zeroes length in subscript as string unicode character
      return negativeStr + `0.0${getSubscript(leadingZeroes)}${tailPart}`;
    }
    if (Number(numStr) < 1) {
      const formattedStr = short
        ? Number(numStr).toFixed(2)
        : Number(numStr).toFixed(5);
      return negativeStr + formattedStr;
    }

    const divideNum = short ? 100 : 10000;
    const formattedNum = String(
      Math.floor(Number(numStr) * divideNum) / divideNum
    );

    return negativeStr + formattedNum;
  };
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log("Initializing TradingView widget...");

    // Use our local UDF endpoints
    const datafeed: IBasicDataFeed = new UDFCompatibleDatafeed(
      "/api/udf",
      undefined,
      {
        maxResponseLength: 1000,
        expectedOrder: "latestFirst",
      }
    );
    // Calculate timeframe for last 2 days
    const currentTime = Math.floor(Date.now() / 1000);
    const twoDaysAgo = currentTime - 2 * 24 * 60 * 60; // 2 days in seconds

    const widgetOptions: ChartingLibraryWidgetOptions = {
      timeframe: { from: twoDaysAgo, to: currentTime }, // Show last 2 days
      symbol: currentTrade?.product_id || "BONDKIT",
      datafeed: datafeed,
      interval: tradingViewDefaultInterval,
      container: chartContainerRef.current,
      library_path: "/static/charting_library/",
      locale: "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_symbol_search",
        "save_chart_properties_to_local_storage",
        "header_compare",
        "vert_touch_drag_scroll",
      ],
      enabled_features: ["study_templates", "hide_left_toolbar_by_default"],
      charts_storage_url: "https://saveload.tradingview.com",
      charts_storage_api_version: "1.1",
      client_id: "tradingview.com",
      user_id: "public_user_id",
      fullscreen: false,
      autosize: true,
      timezone: (tradingViewTimezone || getTimezone()) as Timezone,
      debug: true,
      // Configure time frame buttons in the bottom left
      time_frames: [
        {
          text: "5m",
          resolution: "5" as ResolutionString,
          description: "5 days in 5 minute intervals",
          title: "5m",
        },
        {
          text: "1h",
          resolution: "60" as ResolutionString,
          description: "1 week in 1 hour intervals",
          title: "1h",
        },
        {
          text: "1d",
          resolution: "1D" as ResolutionString,
          description: "1 month in 1 day intervals",
          title: "1d",
        },
        {
          text: "1w",
          resolution: "1W" as ResolutionString,
          description: "6 months in 1 week intervals",
          title: "1w",
        },
      ],
      overrides: {
        "paneProperties.background": theme === "dark" ? "#131316" : "#FAFAFA",
        "paneProperties.backgroundType": "solid",
        "mainSeriesProperties.candleStyle.upColor": "#4AD50D",
        "mainSeriesProperties.candleStyle.borderUpColor": "#4AD50D",
        "mainSeriesProperties.candleStyle.downColor": "#F04438",
        "mainSeriesProperties.candleStyle.borderDownColor": "#F04438",
        "scalesProperties.fontSize": isMobileMode ? 6 : 10,
      },
      studies_overrides: {
        "volume.volume.color.0": "#80231C",
        "volume.volume.color.1": "#215611",
      },
      loading_screen: {
        backgroundColor: "transparent",
      },
      custom_css_url: "/custom-css/tradingview.css",
      custom_font_family: "'Roboto', sans-serif",
      toolbar_bg: theme === "dark" ? "#131316" : "#FAFAFA",
      theme: theme === "dark" ? "dark" : "light",

      custom_formatters: {
        priceFormatterFactory: () => {
          return {
            format: (price, signPositive) => {
              return formatNumber(price, true);
            },
          };
        },
      },
    };

    const tvWidget = new Widget(widgetOptions);
    tvWidgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      console.log("Chart ready! Clearing loading state...");
      setShowLoading(false);
      setChartLoaded(true);
      console.log("Loading state cleared, chart loaded set to true");

      // Subscribe to interval changes
      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval: ResolutionString) => {
          console.log("Interval changed to:", interval);
          isChangingInterval.current = true;
          setTradingViewDefaultInterval(interval);
          // Reset the flag after a short delay
          setTimeout(() => {
            isChangingInterval.current = false;
          }, 300);
        });

      // Subscribe to timezone changes
      tvWidget
        .activeChart()
        .getTimezoneApi()
        .onTimezoneChanged()
        .subscribe(null, (timezone: string) => {
          console.log("Timezone changed to:", timezone);
          setTradingViewTimezone(timezone);
        });
    });

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
    };
  }, [theme, isMobileMode]);

  useEffect(() => {
    if (
      chartLoaded &&
      currentTrade?.product_id &&
      tvWidgetRef.current &&
      !isChangingInterval.current // Only check symbol if we're not changing interval
    ) {
      try {
        const currentSymbol = tvWidgetRef.current.symbolInterval()?.symbol;
        const targetSymbol = currentTrade.product_id;

        console.log(
          "Symbol check - current:",
          currentSymbol,
          "target:",
          targetSymbol
        );

        // Check if symbols are different (handle both normal and contract address formats)
        const isSameSymbol =
          currentSymbol === targetSymbol ||
          (currentSymbol &&
            targetSymbol &&
            currentSymbol.split("-")[1] === targetSymbol.split("-")[1]); // Compare contract addresses

        console.log("Symbol comparison details:", {
          currentSymbol,
          targetSymbol,
          isSameSymbol,
        });

        if (!isSameSymbol) {
          console.log(
            "Symbol change detected, changing from:",
            currentSymbol,
            "to:",
            targetSymbol
          );
          setShowLoading(true);
          try {
            tvWidgetRef.current?.setSymbol?.(
              targetSymbol,
              tradingViewDefaultInterval,
              () => {
                console.log("Symbol set callback called");
                setShowLoading(false);
              }
            );
          } catch (e) {
            console.error("Error setting symbol:", e);
            setShowLoading(false);
          }
        }
      } catch (error) {
        console.error("Error checking symbol:", error);
      }
    }
  }, [chartLoaded, currentTrade?.product_id, tradingViewDefaultInterval]);

  return (
    <div className={`relative h-[600px] w-full ${className || ""}`}>
      <div className="h-full w-full" ref={chartContainerRef} />
      {showLoading && !isChangingInterval.current && (
        <div className="absolute inset-0 z-10 h-full w-full">
          <GifLoadingOverlay />
        </div>
      )}
    </div>
  );
};

export default TradingView;

const getTimezone = (): string => {
  // Simple timezone detection
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === "Asia/Saigon") {
      return "Asia/Ho_Chi_Minh";
    }
    return timezone;
  } catch (e) {
    return "UTC";
  }
};
