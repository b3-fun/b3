import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { useB3Config } from "@b3dotfun/sdk/global-account/react";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import { parseUnits } from "viem";
import { base } from "viem/chains";
import { normalizeAddress } from "../../utils";

export type CheckoutSessionConfig = {
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, string>;
};

export type CreateCheckoutSessionOrderParams = {
  recipientAddress: string;
  dstChain: number;
  dstTokenAddress: string;
  srcFiatAmount: string;
  onramp: {
    vendor: "coinbase" | "stripe-web2" | "none";
    paymentMethod: string;
    country: string;
  };
};

export type UseAnyspendCreateCheckoutSessionOrderProps = {
  checkoutSession: CheckoutSessionConfig;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
};

/**
 * Hook for creating orders via checkout sessions.
 * When a checkoutSession config is provided, orders are created via POST /checkout-sessions
 * instead of POST /orders. The backend creates the order internally and returns
 * checkout_url + order_id.
 */
export function useAnyspendCreateCheckoutSessionOrder({
  checkoutSession,
  onSuccess,
  onError,
}: UseAnyspendCreateCheckoutSessionOrderProps) {
  const { partnerId } = useB3Config();

  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: async (params: CreateCheckoutSessionOrderParams) => {
      const { recipientAddress, dstChain, dstTokenAddress, srcFiatAmount, onramp } = params;

      const srcAmountInWei = parseUnits(srcFiatAmount, USDC_BASE.decimals);

      return anyspendService.createCheckoutSession(
        {
          success_url: checkoutSession.success_url,
          cancel_url: checkoutSession.cancel_url,
          metadata: checkoutSession.metadata,
          amount: srcAmountInWei.toString(),
          recipient_address: normalizeAddress(recipientAddress),
          src_chain: base.id,
          dst_chain: dstChain,
          src_token_address: normalizeAddress(USDC_BASE.address),
          dst_token_address: normalizeAddress(dstTokenAddress),
          onramp: {
            vendor: onramp.vendor,
            payment_method: onramp.paymentMethod,
            country: onramp.country,
          },
        },
        { partnerId },
      );
    },
    onSuccess: (data: any) => {
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return useMemo(
    () => ({
      createOrder,
      isCreatingOrder: isPending,
    }),
    [createOrder, isPending],
  );
}
