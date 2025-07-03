import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";

export function useStripeClientSecret(isMainnet: boolean, paymentIntentId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["stripeClientSecret", isMainnet, paymentIntentId],
    queryFn: () => anyspendService.getStripeClientSecret(isMainnet, paymentIntentId)
  });

  return useMemo(
    () => ({
      clientSecret: data || null,
      isLoadingStripeClientSecret: isLoading,
      stripeClientSecretError: error,
      refetchStripeClientSecret: refetch
    }),
    [data, isLoading, error, refetch]
  );
}
