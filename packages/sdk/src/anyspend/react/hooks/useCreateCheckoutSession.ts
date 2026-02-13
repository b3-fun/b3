import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import type { CheckoutSession, CreateCheckoutSessionRequest } from "../../types/checkoutSession";

export type UseCreateCheckoutSessionProps = {
  onSuccess?: (session: CheckoutSession) => void;
  onError?: (error: Error) => void;
};

export function useCreateCheckoutSession({ onSuccess, onError }: UseCreateCheckoutSessionProps = {}) {
  const {
    mutate: createSession,
    mutateAsync: createSessionAsync,
    isPending,
    data,
    error,
  } = useMutation({
    mutationFn: (params: CreateCheckoutSessionRequest) => anyspendService.createCheckoutSession(params),
    onSuccess: data => {
      if (data.success) onSuccess?.(data.data);
    },
    onError,
  });

  return useMemo(
    () => ({
      createSession,
      createSessionAsync,
      isCreating: isPending,
      session: data?.data ?? null,
      error,
    }),
    [createSession, createSessionAsync, isPending, data, error],
  );
}
