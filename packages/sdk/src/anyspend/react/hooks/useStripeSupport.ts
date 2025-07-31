import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { VisitorData } from "@b3dotfun/sdk/anyspend/types/fingerprint";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useStripeSupport(
  isMainnet: boolean,
  ipAddress: string,
  usdAmount?: string,
  visitorData?: VisitorData,
  isLoadingVisitorData?: boolean,
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["useStripeSupport", isMainnet, ipAddress, usdAmount, visitorData?.requestId, visitorData?.visitorId],
    queryFn: () => anyspendService.checkStripeSupport(isMainnet, ipAddress, usdAmount, visitorData),
    enabled: !!ipAddress && !isLoadingVisitorData,
  });

  return useMemo(
    () => ({
      isStripeOnrampSupported: data?.stripeOnramp || false,
      stripeWeb2Support: data?.stripeWeb2 || { isSupport: false },
      isLoadingStripeSupport: isLoading,
      stripeSupportError: error,
      refetchStripeSupport: refetch,
    }),
    [data, isLoading, error, refetch],
  );
}
