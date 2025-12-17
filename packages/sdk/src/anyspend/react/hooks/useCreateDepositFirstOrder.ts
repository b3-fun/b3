import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { VisitorData } from "@b3dotfun/sdk/anyspend/types/fingerprint";
import { normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import { useB3Config } from "@b3dotfun/sdk/global-account/react";
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { DepositContractConfig } from "../components/AnySpendDeposit";

export type CreateDepositFirstOrderParams = {
  recipientAddress: string;
  srcChain: number;
  dstChain: number;
  srcToken: components["schemas"]["Token"];
  dstToken: components["schemas"]["Token"];
  creatorAddress?: string;
  /** Optional contract config for custom execution after deposit */
  contractConfig?: DepositContractConfig;
};

export type UseCreateDepositFirstOrderProps = {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
};

/**
 * Hook for creating deposit_first orders in the Anyspend protocol.
 * This order type doesn't require srcAmount - the user deposits tokens after the order is created.
 */
export function useCreateDepositFirstOrder({ onSuccess, onError }: UseCreateDepositFirstOrderProps = {}) {
  const { partnerId } = useB3Config();

  const { data: fpData } = useVisitorData({ extendedResult: true }, { immediate: true });
  const visitorData: VisitorData | undefined = fpData && {
    requestId: fpData.requestId,
    visitorId: fpData.visitorId,
  };

  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: async (params: CreateDepositFirstOrderParams) => {
      const { recipientAddress, srcChain, dstChain, srcToken, dstToken, creatorAddress, contractConfig } = params;

      // Build payload based on whether we have a contract config
      const payload = contractConfig
        ? {
            functionAbi: contractConfig.functionAbi,
            functionName: contractConfig.functionName,
            functionArgs: contractConfig.functionArgs,
            to: normalizeAddress(contractConfig.to),
            spenderAddress: contractConfig.spenderAddress ? normalizeAddress(contractConfig.spenderAddress) : undefined,
            action: contractConfig.action,
          }
        : {};

      try {
        return await anyspendService.createOrder({
          recipientAddress: normalizeAddress(recipientAddress),
          type: "deposit_first",
          srcChain,
          dstChain,
          srcTokenAddress: normalizeAddress(srcToken.address),
          dstTokenAddress: normalizeAddress(dstToken.address),
          srcAmount: "", // Not required for deposit_first
          payload,
          metadata: {
            srcToken: {
              chainId: srcToken.chainId,
              address: srcToken.address,
              symbol: srcToken.symbol,
              name: srcToken.name,
              decimals: srcToken.decimals,
              metadata: srcToken.metadata || {},
            },
            dstToken: {
              chainId: dstToken.chainId,
              address: dstToken.address,
              symbol: dstToken.symbol,
              name: dstToken.name,
              decimals: dstToken.decimals,
              metadata: dstToken.metadata || {},
            },
          },
          creatorAddress: creatorAddress ? normalizeAddress(creatorAddress) : undefined,
          partnerId,
          visitorData,
        });
      } catch (error: any) {
        if (error?.data) {
          throw error.data;
        }
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
