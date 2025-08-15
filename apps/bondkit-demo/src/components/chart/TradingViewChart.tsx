import { TradingViewChartProps } from "@/types";
import { CHART_COLORS, DEFAULT_CHART_HEIGHT, PRICE_DECIMALS } from "@/types/constants";
import { cn } from "@/utils/cn";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineStyle,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

// Enhanced price formatter for ETH values
const formatETHPrice = (price: number): string => {
  if (price === 0) return "0";

  // For very small values, use scientific notation
  if (Math.abs(price) < 0.000001) {
    return price.toExponential(2);
  }

  // For small values, show more decimal places
  if (Math.abs(price) < 0.001) {
    return price.toFixed(PRICE_DECIMALS);
  }

  // For medium values, show fewer decimals
  if (Math.abs(price) < 1) {
    return price.toFixed(6);
  }

  // For larger values, use standard formatting
  return price.toFixed(4);
};

export function TradingViewChart({
  candleData,
  volumeData,
  className,
  height = DEFAULT_CHART_HEIGHT,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candlestickSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeries = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartInstance = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.BACKGROUND },
        textColor: CHART_COLORS.TEXT,
        fontSize: 12,
        fontFamily: "ui-monospace, monospace",
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: {
          color: CHART_COLORS.GRID,
          style: LineStyle.Dashed,
        },
        horzLines: {
          color: CHART_COLORS.GRID,
          style: LineStyle.Dashed,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CHART_COLORS.CROSSHAIR,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: CHART_COLORS.GRID,
        },
        horzLine: {
          color: CHART_COLORS.CROSSHAIR,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: CHART_COLORS.GRID,
        },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.GRID,
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.GRID,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 6,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Add candlestick series with enhanced formatting
    const candleSeries = chartInstance.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.UP,
      downColor: CHART_COLORS.DOWN,
      borderUpColor: CHART_COLORS.UP,
      borderDownColor: CHART_COLORS.DOWN,
      wickUpColor: CHART_COLORS.UP,
      wickDownColor: CHART_COLORS.DOWN,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${formatETHPrice(price)} ETH`,
        minMove: 1e-9, // Support very small price movements
      },
    });

    // Add volume series with better formatting
    const volumeSeriesInstance = chartInstance.addSeries(HistogramSeries, {
      color: CHART_COLORS.VOLUME,
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });

    // Configure volume price scale
    chartInstance.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    chart.current = chartInstance;
    candlestickSeries.current = candleSeries;
    volumeSeries.current = volumeSeriesInstance;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    setIsInitialized(true);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
        candlestickSeries.current = null;
        volumeSeries.current = null;
        setIsInitialized(false);
      }
    };
  }, [height]);

  // Update data when candleData or volumeData changes
  useEffect(() => {
    if (!isInitialized || !candlestickSeries.current || !volumeSeries.current) return;
    if (candleData.length === 0) return;

    // Transform data for lightweight-charts format
    const chartCandleData = candleData.map(candle => ({
      time: Math.floor(candle.time / 1000) as any, // Convert to seconds
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const chartVolumeData = volumeData.map((volume, index) => ({
      time: Math.floor(candleData[index]?.time / 1000 || volume.time / 1000) as any,
      value: volume.value,
      color: volume.color || CHART_COLORS.VOLUME,
    }));

    // Set data to series
    candlestickSeries.current.setData(chartCandleData);
    volumeSeries.current.setData(chartVolumeData);

    // Auto-fit content with better scaling
    setTimeout(() => {
      if (chart.current) {
        chart.current.timeScale().fitContent();

        // Adjust price scale for better visibility of small values
        const prices = candleData.flatMap(d => [d.high, d.low, d.open, d.close]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const range = maxPrice - minPrice;

        // Add padding for better visualization
        if (range > 0) {
          const padding = range * 0.1;
          chart.current.priceScale("right").setVisibleRange({
            from: minPrice - padding,
            to: maxPrice + padding,
          });
        }
      }
    }, 100);
  }, [candleData, volumeData, isInitialized]);

  if (candleData.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-lg border border-gray-700 bg-gray-900", className)}
        style={{ height }}
      >
        <div className="text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-gray-700 bg-gray-900", className)}>
      <div ref={chartContainerRef} className="w-full" style={{ height }} />

      {/* Enhanced Controls overlay */}
      <div className="absolute left-4 top-4 z-10 flex gap-2">
        <button
          onClick={() => {
            if (chart.current) {
              chart.current.timeScale().fitContent();
            }
          }}
          className="border-b3-react-border bg-b3-react-card/90 text-b3-react-foreground hover:bg-b3-react-subtle rounded border px-3 py-1 text-xs transition-colors"
        >
          Fit Content
        </button>
        <button
          onClick={() => {
            if (chart.current) {
              chart.current.timeScale().resetTimeScale();
            }
          }}
          className="border-b3-react-border bg-b3-react-card/90 text-b3-react-foreground hover:bg-b3-react-subtle rounded border px-3 py-1 text-xs transition-colors"
        >
          Reset Zoom
        </button>
      </div>

      {/* Price info overlay */}
      <div className="border-b3-react-border bg-b3-react-card/90 text-b3-react-foreground absolute right-4 top-4 z-10 rounded border px-3 py-2 text-xs">
        <div className="text-gray-300">Price in ETH</div>
        {candleData.length > 0 && (
          <div className="font-mono">Latest: {formatETHPrice(candleData[candleData.length - 1].close)} ETH</div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-400">
        Scroll to zoom • Drag to pan • Professional TradingView charts
      </div>
    </div>
  );
}
