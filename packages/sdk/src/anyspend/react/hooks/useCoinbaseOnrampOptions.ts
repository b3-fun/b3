import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useCoinbaseOnrampOptions(isMainnet: boolean, country?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["getCoinbaseOnrampOptions", isMainnet, country],
    queryFn: () => anyspendService.getCoinbaseOnrampOptions(isMainnet, country!),
    enabled: Boolean(country)
  });

  return useMemo(
    () => ({
      coinbaseOnrampOptions: data,
      isLoadingCoinbaseOnrampOptions: isLoading,
      coinbaseOnrampOptionsError: error,
      refetchCoinbaseOnrampOptions: refetch
    }),
    [data, isLoading, error, refetch]
  );
}
