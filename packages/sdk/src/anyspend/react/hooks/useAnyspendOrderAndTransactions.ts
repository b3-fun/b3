import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { GetOrderAndTxsResponse } from "../../types/api_req_res";

// Custom deep equality function that handles BigInt
function customDeepEqual(oldData: any, newData: any): boolean {
  // Handle BigInt comparison
  if (typeof oldData === "bigint" && typeof newData === "bigint") {
    return oldData === newData;
  }

  // Handle arrays
  if (Array.isArray(oldData) && Array.isArray(newData)) {
    return oldData.length === newData.length && oldData.every((item, index) => customDeepEqual(item, newData[index]));
  }

  // Handle objects
  if (oldData && newData && typeof oldData === "object" && typeof newData === "object") {
    const keys1 = Object.keys(oldData);
    const keys2 = Object.keys(newData);
    return keys1.length === keys2.length && keys1.every(key => customDeepEqual(oldData[key], newData[key]));
  }

  // Handle primitive values
  return oldData === newData;
}

// Hook to fetch and auto-refresh order status and transaction details
export function useAnyspendOrderAndTransactions(orderId: string | undefined) {
  const selectFn = useCallback((data: any) => {
    if (!data) return undefined;
    return data;
  }, []);

  const { data, isLoading, refetch, error } = useQuery<GetOrderAndTxsResponse>({
    queryKey: ["getAnyspendOrderAndTransactions", orderId],
    queryFn: () => anyspendService.getOrderAndTransactions(orderId),
    enabled: !!orderId,
    refetchInterval: 3000,
    staleTime: 1000,
    select: selectFn,
    structuralSharing: (oldData, newData) => {
      if (customDeepEqual(oldData, newData)) return oldData;
      return newData;
    },
  });

  return useMemo(
    () => ({
      orderAndTransactions: data,
      isLoadingOrderAndTransactions: isLoading,
      getOrderAndTransactionsError: error,
      refetchOrderAndTransactions: refetch,
    }),
    [data, error, isLoading, refetch],
  );
}
