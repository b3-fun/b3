import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { VisitorData } from "@b3dotfun/sdk/anyspend/types/fingerprint";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useStripeSupport(isMainnet: boolean, ipAddress: string, usdAmount?: string, visitorData?: VisitorData) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["useStripeSupport", isMainnet, ipAddress, usdAmount, visitorData?.requestId, visitorData?.visitorId],
    queryFn: () => anyspendService.checkStripeSupport(isMainnet, ipAddress, usdAmount, visitorData),
    enabled: !!ipAddress,
  });

  return useMemo(
    () => ({
      isStripeOnrampSupported: data?.stripeOnramp || false,
      isStripeWeb2Supported: data?.stripeWeb2 || false,
      isLoadingStripeSupport: isLoading,
      stripeSupportError: error,
      refetchStripeSupport: refetch,
    }),
    [data, isLoading, error, refetch],
  );
}
