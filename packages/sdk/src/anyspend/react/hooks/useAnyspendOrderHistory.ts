import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useAnyspendOrderHistory(
  isMainnet: boolean,
  creatorAddress: string | undefined,
  limit = 100,
  offset = 0,
) {
  const {
    data: rawData = [],
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["getOrderHistory", creatorAddress, limit, offset],
    queryFn: async () => {
      const response = await anyspendService.getOrderHistory(isMainnet, creatorAddress, limit, offset);
      return response.data;
    },
  });

  return useMemo(
    () => ({
      orderHistory: rawData,
      isLoadingOrderHistory: isLoading,
      getOrderHistoryError: error,
      refetchOrderHistory: refetch,
    }),
    [error, isLoading, rawData, refetch],
  );
}
