import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { Nft, OrderType, Token, Tournament } from "@b3dotfun/sdk/anyspend/types";
import { buildMetadata, buildPayload, normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

export type CreateOrderParams = {
  isMainnet: boolean;
  recipientAddress: string;
  orderType: OrderType;
  srcChain: number;
  dstChain: number;
  srcToken: Token;
  dstToken: Token;
  srcAmount: string;
  expectedDstAmount?: string;
  nft?: Nft & { price: string };
  tournament?: Tournament & { contractAddress: string; entryPriceOrFundAmount: string };
  creatorAddress?: string;
  payload?: any;
  partnerId?: string;
};

export type UseAnyspendCreateOrderProps = {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
};

/**
 * Hook for creating orders in the Anyspend protocol
 * Handles regular order creation for swaps, NFT minting, tournament participation, etc.
 * For onramp orders, use useAnyspendCreateOnrampOrder instead.
 */
export function useAnyspendCreateOrder({ onSuccess, onError }: UseAnyspendCreateOrderProps = {}) {
  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      const {
        isMainnet,
        recipientAddress,
        orderType,
        srcChain,
        dstChain,
        srcToken,
        dstToken,
        srcAmount,
        creatorAddress,
      } = params;

      try {
        return await anyspendService.createOrder({
          isMainnet,
          recipientAddress: normalizeAddress(recipientAddress),
          type: orderType,
          srcChain,
          dstChain,
          srcTokenAddress: normalizeAddress(srcToken.address),
          dstTokenAddress: normalizeAddress(dstToken.address),
          srcAmount: srcAmount,
          payload: buildPayload(orderType, {
            orderType,
            srcToken,
            dstToken,
            expectedDstAmount: params.expectedDstAmount,
            nft: params.nft,
            tournament: params.tournament,
            payload: params.payload,
          }),
          metadata: buildMetadata(orderType, {
            orderType,
            srcToken,
            dstToken,
            expectedDstAmount: params.expectedDstAmount,
            nft: params.nft,
            tournament: params.tournament,
            payload: params.payload,
          }),
          creatorAddress: creatorAddress ? normalizeAddress(creatorAddress) : undefined,
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
