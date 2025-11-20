import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { VisitorData } from "@b3dotfun/sdk/anyspend/types/fingerprint";
import { buildMetadata, buildPayload, normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import { useB3 } from "@b3dotfun/sdk/global-account/react";
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { useValidatedClientReferenceId } from "./useValidatedClientReferenceId";

export type CreateOrderParams = {
  recipientAddress: string;
  orderType: components["schemas"]["Order"]["type"];
  srcChain: number;
  dstChain: number;
  srcToken: components["schemas"]["Token"];
  dstToken: components["schemas"]["Token"];
  srcAmount: string;
  expectedDstAmount?: string;
  nft?: components["schemas"]["NFT"] & { price: string };
  tournament?: components["schemas"]["Tournament"] & { contractAddress: string; entryPriceOrFundAmount: string };
  creatorAddress?: string;
  payload?: any;
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
  // Get B3 context values
  const { partnerId } = useB3();

  // Get validated client reference ID from B3 context
  const createValidatedClientReferenceId = useValidatedClientReferenceId();

  // Get fingerprint data
  const { data: fpData } = useVisitorData({ extendedResult: true }, { immediate: true });
  const visitorData: VisitorData | undefined = fpData && {
    requestId: fpData.requestId,
    visitorId: fpData.visitorId,
  };
  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      const { recipientAddress, orderType, srcChain, dstChain, srcToken, dstToken, srcAmount, creatorAddress } = params;
      const clientReferenceId = await createValidatedClientReferenceId(params);

      try {
        return await anyspendService.createOrder({
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
            payload: {
              ...params.payload,
            },
          }),
          metadata: buildMetadata(orderType, {
            orderType,
            srcToken,
            dstToken,
            expectedDstAmount: params.expectedDstAmount,
            nft: params.nft,
            tournament: params.tournament,
            payload: {
              ...params.payload,
            },
          }),
          creatorAddress: creatorAddress ? normalizeAddress(creatorAddress) : undefined,
          partnerId,
          clientReferenceId,
          visitorData,
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
