import { Resolution, TimeFrame } from "./index";

// =============================================================================
// CHART & TRADING CONSTANTS
// =============================================================================

// Map TimeFrame to Resolution
export const TIME_FRAME_TO_RESOLUTION: Record<TimeFrame, Resolution> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "60", // Use 60-minute intervals for 4h timeframe
  "1d": "1D",
};

// Resolution to seconds mapping
export const RESOLUTION_TO_SECONDS: Record<Resolution, number> = {
  "1": 60,
  "5": 300,
  "15": 900,
  "30": 1800,
  "60": 3600,
  "1D": 86400,
  "1W": 604800,
  "1M": 2592000,
};

// =============================================================================
// API CONSTANTS
// =============================================================================

export const DEFAULT_API_ENDPOINT = process.env.NEXT_PUBLIC_B3_API_ENDPOINT || "http://localhost:3031";

export const DEFAULT_API_ENDPOINT_BONDKIT = process.env.NEXT_PUBLIC_B3_API_ENDPOINT + "/bondkit-tokens";

export const DEFAULT_CHAIN_ID = 8453; // Base

export const REFETCH_INTERVAL = 5000; // 5 seconds

// =============================================================================
// PAGINATION CONSTANTS
// =============================================================================

export const DEFAULT_LIMIT = 50;

export const MAX_LIMIT = 1000;

export const DEFAULT_CANDLE_LIMIT = 100;

export const APPEND_CANDLE_LIMIT = 50;

// =============================================================================
// CHART CONSTANTS
// =============================================================================

export const DEFAULT_CHART_HEIGHT = 600;

export const DEFAULT_STARTING_PRICE = 100;

export const DEFAULT_VOLATILITY = 0.02; // 2% price movement

export const DEFAULT_VOLUME_BASE = 1000;

// =============================================================================
// TIMEFRAME CONSTANTS
// =============================================================================

export const TIMEFRAMES = [
  { label: "1m", value: "1m" as TimeFrame, seconds: 60 },
  { label: "5m", value: "5m" as TimeFrame, seconds: 5 * 60 },
  { label: "15m", value: "15m" as TimeFrame, seconds: 15 * 60 },
  { label: "1h", value: "1h" as TimeFrame, seconds: 60 * 60 },
  { label: "4h", value: "4h" as TimeFrame, seconds: 4 * 60 * 60 },
  { label: "1d", value: "1d" as TimeFrame, seconds: 24 * 60 * 60 },
] as const;

// =============================================================================
// TRADING CONSTANTS
// =============================================================================

export const TRADING_ACTIONS = ["buy", "sell"] as const;

export const TRANSACTION_TYPES = ["buy", "sell"] as const;

// =============================================================================
// MOCK DATA CONSTANTS
// =============================================================================

export const MOCK_TRANSACTION_COUNT = 500;

export const MOCK_CANDLE_COUNT = 100;

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const ONE_HOUR_MS = 60 * 60 * 1000;

export const ONE_MINUTE_MS = 60 * 1000;

// =============================================================================
// FORMAT CONSTANTS
// =============================================================================

export const PRICE_DECIMALS = 8;

export const VOLUME_DECIMALS = 2;

export const PERCENTAGE_DECIMALS = 2;

// =============================================================================
// COLOR CONSTANTS
// =============================================================================

export const CHART_COLORS = {
  UP: "#22c55e",
  DOWN: "#ef4444",
  VOLUME: "#64748b",
  BACKGROUND: "#111827",
  TEXT: "#d1d5db",
  GRID: "#374151",
  CROSSHAIR: "#6b7280",
} as const;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

export const MIN_AMOUNT = 0.000001;

export const MAX_AMOUNT = 1000000;

export const MIN_PRICE = 0.00000001;

export const MAX_PRICE = 1000000;
