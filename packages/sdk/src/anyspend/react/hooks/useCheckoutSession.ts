import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useCheckoutSession(
  sessionId: string | null,
  options?: { refetchInterval?: number; enabled?: boolean },
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["checkout-session", sessionId],
    queryFn: () => anyspendService.getCheckoutSession(sessionId!),
    enabled: !!sessionId && (options?.enabled ?? true),
    // Poll every 3s while session is open/processing
    refetchInterval: query => {
      const status = query.state.data?.data?.status;
      if (status === "complete" || status === "expired") return false;
      return options?.refetchInterval ?? 3000;
    },
  });

  return useMemo(
    () => ({
      session: data?.data ?? null,
      isLoading,
      isComplete: data?.data?.status === "complete",
      isExpired: data?.data?.status === "expired",
      error,
    }),
    [data, isLoading, error],
  );
}
