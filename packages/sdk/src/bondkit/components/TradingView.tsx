"use client";

import { loadScriptFromCDN } from "./utils/cdn-loader";
import { formatNumberSmall } from "./utils/format";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TradingViewProps } from "./types";

// TypeScript types - these will be loaded from CDN at runtime
type ChartingLibraryWidgetOptions = any;
type IChartingLibraryWidget = any;
type ResolutionString = string;
type Timezone = string;

// TradingView will be available on window after loading from CDN

// Datafeed will be implemented inline

// Mock loading overlay - replace with your actual loading component
const GifLoadingOverlay = ({ className }: { className?: string }) => (
  <div className={`absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm ${className || ""}`}>
    <Loader2 className="text-secondary-grey h-8 w-8 animate-spin" />
  </div>
);

const TradingView = ({ className, tokenAddress, tokenSymbol }: TradingViewProps) => {
  const theme = "light";

  // Use token info for the current trade
  const currentTrade = {
    product_id: tokenAddress && tokenSymbol ? `${tokenSymbol}-${tokenAddress}` : "BONDKIT",
  };

  const [tradingViewDefaultInterval, setTradingViewDefaultInterval] = useState<ResolutionString>("60");
  const [tradingViewTimezone, setTradingViewTimezone] = useState<string>("");

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const isChangingInterval = useRef(false);

  // Load TradingView libraries from CDN
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        // Load TradingView charting library
        await loadScriptFromCDN("/static/charting_library/charting_library.js");
        setLibrariesLoaded(true);
      } catch (error) {
        console.error("Failed to load TradingView libraries:", error);
      }
    };

    loadLibraries();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || !librariesLoaded) return;

    // Create UDF-compatible datafeed that mimics the original UDFCompatibleDatafeed
    const createUDFDatafeed = (baseUrl: string) => {
      return {
        onReady: (callback: any) => {
          // Fetch configuration from UDF config endpoint
          fetch(`${baseUrl}/config`)
            .then(response => response.json())
            .then(config => callback(config))
            .catch(() => {
              // Fallback configuration if config endpoint fails
              callback({
                supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
                supports_group_request: false,
                supports_marks: false,
                supports_search: false,
                supports_timescale_marks: false,
              });
            });
        },

        searchSymbols: () => {},

        resolveSymbol: (symbolName: string, onSymbolResolvedCallback: any) => {
          // Try to fetch symbol info from UDF endpoint
          fetch(`${baseUrl}/symbols?symbol=${symbolName}`)
            .then(response => response.json())
            .then(symbolInfo => onSymbolResolvedCallback(symbolInfo))
            .catch(() => {
              // Fallback symbol info
              onSymbolResolvedCallback({
                name: symbolName,
                ticker: symbolName,
                description: symbolName,
                type: "crypto",
                session: "24x7",
                timezone: "Etc/UTC",
                exchange: "BONDKIT",
                minmov: 1,
                pricescale: 10000,
                has_intraday: true,
                supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
              });
            });
        },

        getBars: async (symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: any) => {
          try {
            const { from, to, countback } = periodParams;

            // Build URL with parameters matching production
            const params = new URLSearchParams({
              symbol: symbolInfo.ticker,
              resolution: resolution,
              from: from.toString(),
              to: to.toString(),
              currencyCode: "ETH",
            });

            // Add countback if provided
            if (countback) {
              params.append("countback", countback.toString());
            }

            const response = await fetch(`${baseUrl}/history?${params}`);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.s === "ok" && data.t && data.t.length > 0) {
              const bars = data.t.map((time: any, index: number) => ({
                time: parseInt(time) * 1000, // Convert string to number, then to milliseconds
                open: parseFloat(data.o[index]), // Parse string to number
                high: parseFloat(data.h[index]),
                low: parseFloat(data.l[index]),
                close: parseFloat(data.c[index]),
                volume: data.v ? parseFloat(data.v[index]) : 0, // Parse volume string to number
              }));

              onHistoryCallback(bars, { noData: false });
            } else {
              onHistoryCallback([], { noData: true });
            }
          } catch (error) {
            console.error("Error fetching bars:", error);
            onHistoryCallback([], { noData: true });
          }
        },

        subscribeBars: () => {},
        unsubscribeBars: () => {},
      };
    };

    const datafeed = createUDFDatafeed("https://b3-udf-worker.sean-430.workers.dev/bondkit/udf");
    // Calculate timeframe for last 2 days
    const currentTime = Math.floor(Date.now() / 1000);
    const twoDaysAgo = currentTime - 2 * 24 * 60 * 60; // 2 days in seconds

    const widgetOptions: ChartingLibraryWidgetOptions = {
      timeframe: { from: twoDaysAgo, to: currentTime }, // Show last 2 days
      symbol: currentTrade?.product_id || "BONDKIT",
      datafeed: datafeed,
      interval: tradingViewDefaultInterval,
      container: chartContainerRef.current as HTMLElement,
      library_path: "https://cdn.b3.fun/static/charting_library/",
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
        "paneProperties.background": "#FFFFFF",
        "paneProperties.backgroundType": "solid",
        "mainSeriesProperties.candleStyle.upColor": "#4AD50D",
        "mainSeriesProperties.candleStyle.borderUpColor": "#4AD50D",
        "mainSeriesProperties.candleStyle.downColor": "#F04438",
        "mainSeriesProperties.candleStyle.borderDownColor": "#F04438",
        "scalesProperties.fontSize": 10,
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
      toolbar_bg: "#FFFFFF",
      theme: "light",

      custom_formatters: {
        priceFormatterFactory: () => {
          return {
            format: (price: number) => {
              if (price < 0.0001) {
                return formatNumberSmall(price, true);
              }
              return price.toFixed(4);
            },
          };
        },
      },
    };

    const tvWidget = new (window as any).TradingView.widget(widgetOptions);
    tvWidgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      setShowLoading(false);
      setChartLoaded(true);

      // Subscribe to interval changes
      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval: ResolutionString) => {
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
          setTradingViewTimezone(timezone);
        });
    });

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
    };
  }, [theme, librariesLoaded]);

  useEffect(() => {
    if (
      chartLoaded &&
      currentTrade?.product_id &&
      tvWidgetRef.current &&
      !isChangingInterval.current // Only check symbol if we're not changing interval
    ) {
      try {
        const currentSymbol = (tvWidgetRef.current as any).symbolInterval()?.symbol;
        const targetSymbol = currentTrade.product_id;

        // Check if symbols are different (handle both normal and contract address formats)
        const isSameSymbol =
          currentSymbol === targetSymbol ||
          (currentSymbol && targetSymbol && currentSymbol.split("-")[1] === targetSymbol.split("-")[1]); // Compare contract addresses

        if (!isSameSymbol) {
          setShowLoading(true);
          try {
            (tvWidgetRef.current as any)?.setSymbol?.(targetSymbol, tradingViewDefaultInterval, () => {
              setShowLoading(false);
            });
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
      {showLoading && !isChangingInterval.current && <GifLoadingOverlay />}
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
