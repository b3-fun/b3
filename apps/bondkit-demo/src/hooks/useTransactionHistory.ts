import { Transaction } from "@/types";
import { DEFAULT_API_ENDPOINT_BONDKIT, DEFAULT_CHAIN_ID, DEFAULT_LIMIT } from "@/types/constants";
import { useCallback, useEffect, useState } from "react";

export function useTransactionHistory(
  tokenAddress: string,
  chainId: number = DEFAULT_CHAIN_ID,
  apiEndpoint: string = DEFAULT_API_ENDPOINT_BONDKIT,
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLoaded, setTotalLoaded] = useState(0);

  const fetchTransactionHistory = useCallback(
    async (toTimestamp?: number, appendData = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const limit = DEFAULT_LIMIT;
        const to = toTimestamp || Date.now();

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-service-method": "getTransactionHistory",
          },
          body: JSON.stringify({
            contractAddress: tokenAddress,
            chainId: chainId,
            limit: limit,
            to: to,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.data || result.data.length === 0) {
          if (!appendData) {
            setTransactions([]);
            setTotalLoaded(0);
          }
          return;
        }

        const newTransactions: Transaction[] = result.data.map((tx: Transaction) => ({
          timestamp: tx.timestamp,
          price: tx.price,
          amount: tx.amount,
          type: tx.type,
          userAddress: tx.userAddress,
          txHash: tx.txHash,
          chainId: tx.chainId || chainId,
        }));

        setTransactions(prev => {
          if (appendData) {
            const combined = [...prev, ...newTransactions];
            const uniqueTransactions = combined.filter(
              (tx, index, arr) => arr.findIndex(t => t.txHash === tx.txHash) === index,
            );
            return uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp);
          } else {
            return newTransactions.sort((a, b) => b.timestamp - a.timestamp);
          }
        });

        setTotalLoaded(prev => (appendData ? prev + newTransactions.length : newTransactions.length));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch transaction history");
        if (!appendData) {
          setTransactions([]);
          setTotalLoaded(0);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [tokenAddress, chainId, apiEndpoint],
  );

  const loadInitialData = useCallback(async () => {
    await fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  const loadMoreData = useCallback(async () => {
    if (isLoading || transactions.length === 0) return;

    const oldestTransaction = transactions[transactions.length - 1];
    const endTime = oldestTransaction.timestamp;

    await fetchTransactionHistory(endTime, true);
  }, [fetchTransactionHistory, isLoading, transactions]);

  const refresh = useCallback(async () => {
    setTransactions([]);
    setTotalLoaded(0);
    await loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    transactions,
    isLoading,
    totalLoaded,
    loadMoreData,
    refresh,
    error,
  };
}
