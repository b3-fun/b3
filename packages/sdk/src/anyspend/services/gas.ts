import { GAS_ORACLE_BASE_URL } from "../constants";
import type { GasOracleResponse, GasPriceData } from "../types/gas";

/** Supported chain IDs for gas oracle */
export const GAS_ORACLE_SUPPORTED_CHAINS = [
  1, // Ethereum
  137, // Polygon
  42161, // Arbitrum
  8453, // Base
  56, // BSC
  10, // Optimism
  43114, // Avalanche
  8333, // B3
  2741, // Abstract
  4689, // IoTeX
  3338, // Peaq
  1329, // Sei
] as const;

export type GasOracleSupportedChainId = (typeof GAS_ORACLE_SUPPORTED_CHAINS)[number];

/** Check if a chain is supported by the gas oracle */
export function isGasOracleSupported(chainId: number): chainId is GasOracleSupportedChainId {
  return GAS_ORACLE_SUPPORTED_CHAINS.includes(chainId as GasOracleSupportedChainId);
}

/** Fetch gas price data from the gas oracle */
export async function fetchGasPrice(chainId: number): Promise<GasOracleResponse> {
  const response = await fetch(`${GAS_ORACLE_BASE_URL}/gas/${chainId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch gas price for chain ${chainId}: ${response.status}`);
  }

  return response.json();
}

/** Transform raw oracle response to simplified UI data */
export function toGasPriceData(response: GasOracleResponse): GasPriceData {
  const { analysis } = response;
  const isSpike = analysis.level === "elevated" || analysis.level === "high" || analysis.level === "spike";

  return {
    chainId: response.chainId,
    chainName: response.chainName,
    gasPriceGwei: response.gasPrice.standard,
    baseFeeGwei: response.eip1559?.baseFee,
    level: analysis.level,
    isSpike,
    recommendation: analysis.recommendation,
    vsMedian: analysis.vs1h, // Use 1h as primary comparison
    source: response.source,
    timestamp: response.timestamp,
  };
}

/** Gas service for fetching and transforming gas data */
export const gasService = {
  /** Fetch raw gas oracle response */
  fetchRaw: fetchGasPrice,

  /** Fetch and transform to UI-friendly format */
  fetch: async (chainId: number): Promise<GasPriceData> => {
    const response = await fetchGasPrice(chainId);
    return toGasPriceData(response);
  },

  /** Check if chain is supported */
  isSupported: isGasOracleSupported,

  /** List of supported chain IDs */
  supportedChains: GAS_ORACLE_SUPPORTED_CHAINS,
};
