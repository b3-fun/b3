import { TradeHistoryNode } from "@/types";
import { formatLargeNumber } from "@/utils/formatNumber";
import React, { memo } from "react";

// Mock data for demonstration
const mockTradeHistory: TradeHistoryNode[] = [
  {
    id: "1",
    price: 0.000123,
    size: 1500,
    maker_side: "buy",
    time: Date.now() - 1000,
    fe_nonce: "nonce1",
  },
  {
    id: "2",
    price: 0.000122,
    size: 2300,
    maker_side: "sell",
    time: Date.now() - 2000,
    fe_nonce: "nonce2",
  },
  {
    id: "3",
    price: 0.000124,
    size: 1800,
    maker_side: "buy",
    time: Date.now() - 3000,
    fe_nonce: "nonce3",
  },
  {
    id: "4",
    price: 0.000121,
    size: 3200,
    maker_side: "sell",
    time: Date.now() - 4000,
    fe_nonce: "nonce4",
  },
  {
    id: "5",
    price: 0.000125,
    size: 900,
    maker_side: "buy",
    time: Date.now() - 5000,
    fe_nonce: "nonce5",
  },
];

// Local utility functions
const formatAmount = (amount: number | string, decimals?: string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";

  // If we have decimals info, try to use it
  if (decimals && !isNaN(parseInt(decimals))) {
    const decimalPlaces = parseInt(decimals);
    return num.toFixed(decimalPlaces);
  }

  // Default formatting
  if (num >= 1000) {
    return formatLargeNumber(num, 2);
  }

  return num.toFixed(num < 1 ? 6 : 2);
};

const toClientTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return {
    format: (format: string) => {
      if (format === "HH:mm:ss") {
        return date.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
      return date.toLocaleString();
    },
  };
};

// Simple Text component replacement
const Text = ({
  preset,
  className = "",
  text,
  children,
}: {
  preset?: string;
  className?: string;
  text?: string;
  children?: React.ReactNode;
}) => {
  const presetClasses = {
    p5: "text-xs",
    p4: "text-sm",
    p3: "text-base",
  };

  const textClass = preset
    ? presetClasses[preset as keyof typeof presetClasses] || "text-sm"
    : "text-sm";

  return (
    <span className={`${textClass} ${className}`}>{text || children}</span>
  );
};

// Simple UnitLabel component replacement
const UnitLabel = ({ unit }: { unit?: string }) => {
  if (!unit) return null;
  return <span className="text-xs text-gray-400">({unit})</span>;
};

export const TradeHistory = ({ className }: { className?: string }) => {
  // Mock current trade info - in real app this would come from props or context
  const currentTrade = {
    display_base_asset_symbol: "TOKEN",
    quote_asset_symbol: "ETH",
    quote_increment: "8",
    base_increment: "18",
  };

  const tradeHistory = mockTradeHistory;
  const {
    display_base_asset_symbol,
    quote_asset_symbol,
    quote_increment,
    base_increment,
  } = currentTrade;

  return (
    <div
      className={`relative flex w-full flex-col justify-center ${
        className || ""
      }`}
    >
      <div
        className="flex gap-1 overflow-hidden border-y border-gray-600 p-2 text-gray-200"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        <Text
          preset="p5"
          className="flex flex-1 items-center justify-start gap-1"
        >
          Price <UnitLabel unit={quote_asset_symbol} />
        </Text>
        <Text
          preset="p5"
          className="flex flex-1 items-center justify-end gap-1 text-right"
        >
          Size <UnitLabel unit={display_base_asset_symbol} />
        </Text>
        <Text preset="p5" className="flex-1 text-right">
          Time
        </Text>
      </div>
      <div
        className="h-0 flex-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        {tradeHistory?.map((item) => (
          <TradeHistoryItem
            data={item}
            key={`${item.id}_${item.fe_nonce || "nonce"}`}
            quoteIncrement={quote_increment}
            baseIncrement={base_increment}
          />
        ))}
      </div>
    </div>
  );
};

const TradeHistoryItem = memo(
  ({
    data,
    quoteIncrement,
    baseIncrement,
  }: {
    data: TradeHistoryNode;
    quoteIncrement: string | undefined;
    baseIncrement: string | undefined;
  }) => {
    const { price, size, maker_side, time } = data;

    const priceString = formatAmount(price, quoteIncrement);
    const decimalPart = priceString.split(".")[1];
    const numberPart = priceString.split(".")[0];

    const isSell = maker_side?.toLowerCase() === "buy";

    return (
      <div
        className={`flex gap-1 px-2 py-0.5 font-mono text-[10px] hover:bg-gray-700/50 ${
          isSell ? "bg-red-900/20" : "bg-green-900/20"
        }`}
      >
        <div
          className={`flex-1 py-0.5 ${
            isSell ? "text-red-400" : "text-green-400"
          }`}
        >
          {numberPart}
          {decimalPart ? (
            <span className={isSell ? "text-red-300" : "text-green-300"}>
              .{decimalPart}
            </span>
          ) : null}
        </div>
        <div className="flex-1 text-right text-gray-300">
          {formatAmount(size, baseIncrement)}
        </div>
        <div className="flex-1 text-right text-gray-400">
          {toClientTime(time).format("HH:mm:ss")}
        </div>
      </div>
    );
  },
  (oldProps, newProps) =>
    oldProps.data.id === newProps.data.id &&
    oldProps.baseIncrement === newProps.baseIncrement &&
    oldProps.quoteIncrement === newProps.quoteIncrement
);

TradeHistoryItem.displayName = "TradeHistoryItem";
