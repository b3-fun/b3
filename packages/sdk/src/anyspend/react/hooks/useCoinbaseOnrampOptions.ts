import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { VisitorData } from "@b3dotfun/sdk/anyspend/types/fingerprint";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useCoinbaseOnrampOptions(isMainnet: boolean, country?: string, visitorData?: VisitorData) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["getCoinbaseOnrampOptions", isMainnet, country, visitorData],
    queryFn: () => anyspendService.getCoinbaseOnrampOptions(isMainnet, country!, visitorData),
    enabled: Boolean(country),
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
