import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { VisitorData } from "@b3dotfun/sdk/anyspend/types/fingerprint";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useCoinbaseOnrampOptions(country?: string, visitorData?: VisitorData, isLoadingVisitorData?: boolean) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["getCoinbaseOnrampOptions", country, visitorData],
    queryFn: () => anyspendService.getCoinbaseOnrampOptions(country!, visitorData), // nhd98z
    enabled: Boolean(country) && !isLoadingVisitorData,
  });

  return useMemo(
    () => ({
      coinbaseOnrampOptions: data?.data,
      isLoadingCoinbaseOnrampOptions: isLoading,
      coinbaseOnrampOptionsError: error,
      refetchCoinbaseOnrampOptions: refetch,
    }),
    [data, isLoading, error, refetch],
  );
}
