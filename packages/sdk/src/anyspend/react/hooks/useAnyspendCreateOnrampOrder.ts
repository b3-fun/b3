import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { Nft, OnrampVendor, OrderType, Token, Tournament } from "@b3dotfun/sdk/anyspend/types";
import { normalizeAddress, buildMetadata, buildPayload } from "@b3dotfun/sdk/anyspend/utils";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { parseUnits } from "viem";
import { base } from "viem/chains";
import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";

export type OnrampOptions = {
  vendor: OnrampVendor;
  paymentMethod: string;
  country: string;
  redirectUrl: string;
  ipAddress?: string; // Required for Stripe
};

export type CreateOnrampOrderParams = {
  isMainnet: boolean;
  recipientAddress: string;
  orderType: OrderType;
  dstChain: number;
  dstToken: Token;
  srcFiatAmount: string;
  onramp: OnrampOptions;
  expectedDstAmount: string;
  creatorAddress?: string;
  nft?: Nft & { price: string };
  tournament?: Tournament & { contractAddress: string; entryPriceOrFundAmount: string };
  payload?: any;
};

export type UseAnyspendCreateOnrampOrderProps = {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
};

/**
 * Hook for creating onramp orders in the Anyspend protocol
 * Specifically handles orders that involve fiat-to-crypto onramp functionality
 */
export function useAnyspendCreateOnrampOrder({ onSuccess, onError }: UseAnyspendCreateOnrampOrderProps = {}) {
  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: async (params: CreateOnrampOrderParams) => {
      const {
        isMainnet,
        recipientAddress,
        orderType,
        dstChain,
        dstToken,
        srcFiatAmount,
        onramp,
        creatorAddress,
        expectedDstAmount,
        nft,
        tournament,
        payload
      } = params;

      try {
        // Validate Stripe onramp options
        if (onramp.vendor === "stripe" && !onramp.ipAddress) {
          throw new Error("IP address is required for Stripe onramp");
        }

        // Validate required onramp fields
        if (!onramp.vendor || !onramp.country) {
          throw new Error("Missing required onramp fields: vendor, country");
        }

        const srcToken = USDC_BASE;
        const srcChain = base.id;

        // Create order with USDC on Base as source
        const srcAmountOnRampInWei = parseUnits(srcFiatAmount, USDC_BASE.decimals);

        return await anyspendService.createOrder({
          isMainnet,
          recipientAddress: normalizeAddress(recipientAddress),
          type: orderType,
          srcChain,
          srcTokenAddress: normalizeAddress(srcToken.address),
          dstChain,
          dstTokenAddress: normalizeAddress(dstToken.address),
          srcAmount: srcAmountOnRampInWei.toString(),
          payload: buildPayload(orderType, {
            orderType,
            srcToken,
            dstToken,
            expectedDstAmount,
            nft,
            tournament,
            payload
          }),
          onramp,
          metadata: buildMetadata(orderType, {
            orderType,
            srcToken,
            dstToken,
            expectedDstAmount,
            nft,
            tournament,
            payload
          }),
          creatorAddress: creatorAddress ? normalizeAddress(creatorAddress) : undefined
        });
      } catch (error: any) {
        // If the error has a response with message and statusCode, throw that
        if (error?.data) {
          throw error.data;
        }
        // Otherwise throw the original error
        throw error;
      }
    },
    onSuccess: (data: any) => {
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    }
  });

  return useMemo(
    () => ({
      createOrder,
      isCreatingOrder: isPending
    }),
    [createOrder, isPending]
  );
}
