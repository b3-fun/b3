// =============================================================================
// TRADING & CHART TYPES
// =============================================================================

export type Resolution = "1" | "5" | "15" | "30" | "60" | "1D" | "1W" | "1M";

export type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type Action = "buy" | "sell";

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface VolumeData {
  time: number;
  value: number;
  color?: string;
}

export interface ChartTokenInfo {
  name: string;
  symbol: string;
  contractAddress: string;
  chainId: number;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  currentPrice: number;
  change24h: number;
  volume24h: number;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface Transaction {
  _id?: string;
  chainId: number;
  txHash: string;
  blockNumber?: number;
  timestamp: number;
  bondkitTokenId?: string;
  price: number;
  amount: string;
  value?: number;
  type: "buy" | "sell";
  userAddress: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface TransactionData {
  total: number;
  data: Transaction[];
  limit: number;
  skip: number;
}

// =============================================================================
// TOKEN TYPES
// =============================================================================

export interface BondkitTokenData {
  _id: string;
  contractAddress: string;
  chainId: number;
  name: string;
  symbol: string;
  initializer: string;
  initializationTxHash: string;
  initializationTimestamp: number;
  initializationBlockNumber: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// TRADING HISTORY TYPES
// =============================================================================

export interface TradeHistoryNode {
  id: string;
  price: number;
  size: number;
  maker_side: "buy" | "sell";
  time: number;
  fe_nonce?: string;
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

export interface TokenChartProps {
  tokenAddress: string;
  chainId?: number;
  apiEndpoint?: string;
}

export interface TradingViewChartProps {
  candleData: CandleData[];
  volumeData: VolumeData[];
  className?: string;
  height?: number;
}

export interface TradingViewProps {
  className?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
}

export interface TokenPageProps {
  params: {
    address: string;
  };
}

export interface TokenInteractionProps {
  tokenAddress: `0x${string}`;
  onUnmount: () => void;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  total?: number;
  limit?: number;
  skip?: number;
  error?: string;
}

export interface GetTokensResponse {
  data: BondkitTokenData[];
  total: number;
  limit: number;
  skip: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Address = `0x${string}`;

export type TxType = "approve" | "sell" | "buy" | "migrate" | null;

export interface BondingProgress {
  progress: number;
  raised: bigint;
  threshold: bigint;
}

export interface TokenHolder {
  address: Address;
  balance: bigint;
  percentage: number;
}
