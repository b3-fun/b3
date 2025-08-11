import { CandleData, TimeFrame, Transaction, VolumeData } from "@/types/chart";

// Time frame duration in milliseconds
const TIME_FRAMES: Record<TimeFrame, number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

/**
 * Groups transactions by time intervals
 */
function groupTransactionsByTime(transactions: Transaction[], timeFrame: TimeFrame): Map<number, Transaction[]> {
  const intervalMs = TIME_FRAMES[timeFrame];
  const groups = new Map<number, Transaction[]>();

  transactions.forEach(transaction => {
    // Calculate the interval start time (floor to interval boundary)
    const intervalStart = Math.floor(transaction.timestamp / intervalMs) * intervalMs;

    if (!groups.has(intervalStart)) {
      groups.set(intervalStart, []);
    }
    groups.get(intervalStart)!.push(transaction);
  });

  return groups;
}

/**
 * Calculates OHLCV data from grouped transactions
 */
function calculateOHLCV(transactions: Transaction[]): Omit<CandleData, "time"> {
  if (transactions.length === 0) {
    return { open: 0, high: 0, low: 0, close: 0, volume: 0 };
  }

  // Sort by timestamp to get proper open/close
  const sortedTransactions = transactions.sort((a, b) => a.timestamp - b.timestamp);

  const open = sortedTransactions[0].price;
  const close = sortedTransactions[sortedTransactions.length - 1].price;
  const high = Math.max(...transactions.map(t => t.price));
  const low = Math.min(...transactions.map(t => t.price));

  // Calculate volume (sum of all amounts, convert from wei)
  const volume = transactions.reduce((sum, t) => {
    const amount = parseFloat(t.amount) / Math.pow(10, 18); // Assuming 18 decimals
    return sum + amount;
  }, 0);

  return { open, high, low, close, volume };
}

/**
 * Converts transaction data to candlestick data for chart
 */
export function transformToCandleData(transactions: Transaction[], timeFrame: TimeFrame): CandleData[] {
  if (!transactions.length) return [];

  const grouped = groupTransactionsByTime(transactions, timeFrame);
  const candles: CandleData[] = [];

  // Sort by timestamp to ensure proper order
  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => a - b);

  sortedGroups.forEach(([timestamp, groupTransactions]) => {
    const ohlcv = calculateOHLCV(groupTransactions);
    candles.push({
      time: timestamp,
      ...ohlcv,
    });
  });

  return fillMissingCandles(candles, timeFrame);
}

/**
 * Converts transaction data to volume data for chart
 */
export function transformToVolumeData(transactions: Transaction[], timeFrame: TimeFrame): VolumeData[] {
  const candles = transformToCandleData(transactions, timeFrame);

  return candles.map(candle => ({
    time: candle.time,
    value: candle.volume,
    color: candle.close >= candle.open ? "#22c55e" : "#ef4444", // green for up, red for down
  }));
}

/**
 * Fills gaps in candle data with appropriate values
 */
function fillMissingCandles(candles: CandleData[], timeFrame: TimeFrame): CandleData[] {
  if (candles.length < 2) return candles;

  const intervalMs = TIME_FRAMES[timeFrame];
  const filled: CandleData[] = [];

  for (let i = 0; i < candles.length - 1; i++) {
    filled.push(candles[i]);

    const currentTime = candles[i].time;
    const nextTime = candles[i + 1].time;
    const gap = nextTime - currentTime;

    // Fill gaps larger than one interval
    if (gap > intervalMs) {
      const missingIntervals = Math.floor(gap / intervalMs) - 1;

      for (let j = 1; j <= missingIntervals; j++) {
        const missingTime = currentTime + j * intervalMs;
        const lastClose = candles[i].close;

        // Create a flat candle with previous close price
        filled.push({
          time: missingTime,
          open: lastClose,
          high: lastClose,
          low: lastClose,
          close: lastClose,
          volume: 0,
        });
      }
    }
  }

  // Add the last candle
  filled.push(candles[candles.length - 1]);

  return filled;
}

/**
 * Formats price for display
 */
export function formatPrice(price: number, decimals = 6): string {
  if (price === 0) return "0";

  if (price < 0.000001) {
    return price.toExponential(2);
  }

  if (price < 1) {
    return price.toFixed(decimals);
  }

  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats volume for display
 */
export function formatVolume(volume: number): string {
  if (volume === 0) return "0";

  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }

  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }

  return volume.toFixed(2);
}

/**
 * Calculates percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
