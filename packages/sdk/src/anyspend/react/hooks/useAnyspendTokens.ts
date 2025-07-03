import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useAnyspendTokenList(isMainnet: boolean, chainId: number, query: string) {
  const {
    data = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["getAnyspendTokenList", chainId, query],
    queryFn: () => anyspendService.getTokenList(isMainnet, chainId, query),
    enabled: true
  });

  return useMemo(
    () => ({
      data,
      isLoading,
      refetch
    }),
    [data, isLoading, refetch]
  );
}
