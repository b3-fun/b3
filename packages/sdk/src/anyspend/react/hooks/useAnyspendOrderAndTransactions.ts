import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { GetOrderAndTxsResponse } from "@b3dotfun/sdk/anyspend/types";
import { useQuery } from "@tanstack/react-query";
import isEqual from "lodash/isEqual.js";
import { useCallback, useMemo } from "react";

// Hook to fetch and auto-refresh order status and transaction details
export function useAnyspendOrderAndTransactions(isMainnet: boolean, orderId: string | undefined) {
  const selectFn = useCallback((data: any) => {
    if (!data) return undefined;
    return data;
  }, []);

  const { data, isLoading, refetch, error } = useQuery<GetOrderAndTxsResponse>({
    queryKey: ["getAnyspendOrderAndTransactions", orderId],
    queryFn: () => anyspendService.getOrderAndTransactions(isMainnet, orderId),
    enabled: Boolean(orderId),
    refetchInterval: 3000,
    staleTime: 1000,
    select: selectFn,
    structuralSharing: (oldData, newData) => {
      if (isEqual(oldData, newData)) return oldData;
      return newData;
    }
  });

  return useMemo(
    () => ({
      orderAndTransactions: data,
      isLoadingOrderAndTransactions: isLoading,
      getOrderAndTransactionsError: error,
      refetchOrderAndTransactions: refetch
    }),
    [data, error, isLoading, refetch]
  );
}
