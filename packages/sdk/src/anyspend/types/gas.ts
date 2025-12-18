/** Gas level classification based on historical percentiles */
export type GasLevel = "low" | "normal" | "elevated" | "high" | "spike";

/** Gas prices in Gwei for different speed tiers */
export interface GasPrices {
  low: string;
  standard: string;
  fast: string;
  instant?: string;
}

/** EIP-1559 specific gas data */
export interface Eip1559Data {
  baseFee: string;
  maxPriorityFee: GasPrices;
  maxFee: GasPrices;
}

/** Spike analysis comparing current gas to historical data */
export interface GasSpikeAnalysis {
  level: GasLevel;
  percentile: number;
  /** Ratio to 1h median (primary spike detection) */
  vs1h: number;
  /** Ratio to 4h median (short-term context) */
  vs4h: number;
  /** Ratio to 24h median (daily context) */
  vs24h: number;
  recommendation: string;
}

/** Full gas response from the gas oracle */
export interface GasOracleResponse {
  chainId: number;
  chainName: string;
  timestamp: string;
  blockNumber?: number;
  source: "blocknative" | "rpc";
  gasPrice: GasPrices;
  eip1559?: Eip1559Data;
  analysis: GasSpikeAnalysis;
  cached: boolean;
  cacheAge?: number;
}

/** Simplified gas data for UI display */
export interface GasPriceData {
  chainId: number;
  chainName: string;
  /** Standard gas price in Gwei */
  gasPriceGwei: string;
  /** Base fee in Gwei (EIP-1559 chains) */
  baseFeeGwei?: string;
  /** Gas level classification */
  level: GasLevel;
  /** Whether gas is currently spiking (elevated, high, or spike) */
  isSpike: boolean;
  /** Human-readable recommendation */
  recommendation: string;
  /** Ratio to recent median (1 = normal, >1.5 = elevated) */
  vsMedian: number;
  /** Data source */
  source: "blocknative" | "rpc";
  /** Timestamp of the data */
  timestamp: string;
}
