import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import { SendPermitDataRequestBody } from "@b3dotfun/sdk/anyspend/types";
import { useMutation } from "@tanstack/react-query";
import { UseAnyspendCreateOrderProps } from "./useAnyspendCreateOrder";

export function useAnyspendSendPermitData({ onSuccess, onError }: UseAnyspendCreateOrderProps = {}) {
  const { mutate: sendPermitData, isPending } = useMutation({
    mutationFn: async ({ isMainnet, orderId, permitData }: SendPermitDataRequestBody & { isMainnet: boolean }) => {
      try {
        const response = await anyspendService.sendPermitData({
          isMainnet,
          orderId,
          permitData
        });
        if (response.statusCode !== 200) throw response;
        return response;
      } catch (error: any) {
        // If the error has a response with message and statusCode, throw that
        if (error.response?.data) {
          throw error.response.data;
        }
        // Otherwise throw the original error
        throw error;
      }
    },
    onSuccess: data => {
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    }
  });

  return {
    sendPermitData,
    isSendingPermitData: isPending
  };
}
