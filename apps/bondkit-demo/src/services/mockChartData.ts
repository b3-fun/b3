import { TokenInfo, Transaction, TransactionData } from '@/types/chart';

// Generate mock transaction data for demonstration
export function generateMockTransactions(count: number = 1000): Transaction[] {
  const transactions: Transaction[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  let currentPrice = 0.000045; // Starting price in ETH
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * (oneDay / count); // Spread over last day
    
    // Price walk with some volatility
    const change = (Math.random() - 0.5) * 0.000002;
    currentPrice = Math.max(0.000001, currentPrice + change);
    
    const isBuy = Math.random() > 0.5;
    const amount = (Math.random() * 1000 + 100) * Math.pow(10, 18); // Random amount in wei
    
    transactions.push({
      _id: `tx_${i}`,
      chainId: 1,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: 18000000 + i,
      timestamp,
      bondkitTokenId: 'DEMO',
      price: currentPrice,
      amount: amount.toString(),
      value: currentPrice * (amount / Math.pow(10, 18)),
      type: isBuy ? 'buy' : 'sell',
      userAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  
  return transactions.sort((a, b) => a.timestamp - b.timestamp);
}

export function getMockTransactionData(): TransactionData {
  const transactions = generateMockTransactions(500);
  
  return {
    total: transactions.length,
    data: transactions,
    limit: 100,
    skip: 0,
  };
}

export function getMockTokenInfo(): TokenInfo {
  const transactions = generateMockTransactions(100);
  const latestPrice = transactions[transactions.length - 1]?.price || 0.000045;
  const previousPrice = transactions[transactions.length - 25]?.price || latestPrice;
  const change24h = ((latestPrice - previousPrice) / previousPrice) * 100;
  
  const volume24h = transactions
    .filter(tx => tx.timestamp > Date.now() - 24 * 60 * 60 * 1000)
    .reduce((sum, tx) => sum + parseFloat(tx.amount) / Math.pow(10, 18), 0);
  
  return {
    name: 'Bondkit Token',
    symbol: 'BKT',
    currentPrice: latestPrice,
    change24h,
    volume24h,
  };
} 