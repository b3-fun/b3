import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { CreateOrderResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import { VisitorData } from "@b3dotfun/sdk/anyspend/types/fingerprint";
import { buildMetadata, buildPayload, normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import { useB3Config } from "@b3dotfun/sdk/global-account/react";
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import { parseUnits } from "viem";
import { base } from "viem/chains";
import { useAccount } from "wagmi";
import { CreateOrderParams } from "./useAnyspendCreateOrder";
import { getCachedWalletHeaders } from "./useKycStatus";
import { useValidatedClientReferenceId } from "./useValidatedClientReferenceId";

export type OnrampOptions = {
  vendor: components["schemas"]["OnrampMetadata"]["vendor"];
  paymentMethod: string;
  country: string;
  redirectUrl: string;
};

export type CreateOnrampOrderParams = Omit<CreateOrderParams, "srcChain" | "srcToken" | "srcAmount"> & {
  srcFiatAmount: string;
  onramp: OnrampOptions;
  /** When true, fees are added on top of srcAmount (payer pays more, receiver gets exact amount) */
  feeOnTop?: boolean;
};

export type UseAnyspendCreateOnrampOrderProps = {
  onSuccess?: (data: CreateOrderResponse) => void;
  onError?: (error: Error) => void;
};

/**
 * Hook for creating onramp orders in the Anyspend protocol
 * Specifically handles orders that involve fiat-to-crypto onramp functionality
 */
export function useAnyspendCreateOnrampOrder({ onSuccess, onError }: UseAnyspendCreateOnrampOrderProps = {}) {
  // Get B3 context values
  const { partnerId } = useB3Config();
  const { address } = useAccount();

  // Get validated client reference ID from B3 context
  const createValidatedClientReferenceId = useValidatedClientReferenceId();

  // Get fingerprint data
  const { data: fpData } = useVisitorData({ extendedResult: true }, { immediate: true });
  const visitorData: VisitorData | undefined = fpData && {
    requestId: fpData.requestId,
    visitorId: fpData.visitorId,
  };

  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: async (params: CreateOnrampOrderParams) => {
      const {
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
        payload,
      } = params;

      const clientReferenceId = await createValidatedClientReferenceId(params);

      try {
        // Validate required onramp fields
        if (!onramp.vendor || !onramp.country) {
          throw new Error("Missing required onramp fields: vendor, country");
        }

        const srcToken = USDC_BASE;
        const srcChain = base.id;

        // Create order with USDC on Base as source
        const srcAmountOnRampInWei = parseUnits(srcFiatAmount, USDC_BASE.decimals);

        // For card payments, include wallet auth headers so the backend can verify
        // KYC by the signing wallet address (may differ from the B3 JWT address).
        // Only use already-cached headers — never trigger a fresh wallet signature
        // here, as that would prompt the user without their explicit consent.
        // KycGate pre-caches the headers in the "Continue to Verify" user-gesture.
        let kycWalletHeaders: Record<string, string> | undefined;
        if (onramp.vendor === "stripe-web2" && address) {
          kycWalletHeaders = getCachedWalletHeaders(address);
        }

        return await anyspendService.createOrder({
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
            payload: {
              ...payload,
            },
          }),
          onramp,
          metadata: buildMetadata(orderType, {
            orderType,
            srcToken,
            dstToken,
            expectedDstAmount,
            nft,
            tournament,
            payload: {
              ...payload,
            },
          }),
          creatorAddress: creatorAddress ? normalizeAddress(creatorAddress) : undefined,
          partnerId,
          clientReferenceId,
          visitorData,
          callbackMetadata: params.callbackMetadata,
          feeOnTop: params.feeOnTop,
          kycWalletHeaders,
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
    onSuccess: (data: CreateOrderResponse) => {
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
