import { useEffect, useRef } from "react";
import { GetOrderAndTxsResponse } from "../../types/api_req_res";

/**
 * Hook to call onSuccess callback when an order is executed.
 * Handles fallback to relayTxs when executeTx is null.
 */
export function useOnOrderSuccess({
  orderData,
  orderId,
  onSuccess,
}: {
  orderData: GetOrderAndTxsResponse | undefined;
  orderId: string | undefined;
  onSuccess?: (txHash?: string) => void;
}) {
  const onSuccessCalled = useRef(false);
  const prevOrderId = useRef(orderId);

  useEffect(() => {
    // Reset flag when orderId changes
    if (prevOrderId.current !== orderId) {
      onSuccessCalled.current = false;
      prevOrderId.current = orderId;
    }

    // Call onSuccess when order is executed
    if (orderData?.data?.order.status === "executed" && !onSuccessCalled.current) {
      const relayTxs = orderData?.data?.relayTxs;
      const lastSuccessfulRelayTx = relayTxs?.filter(tx => tx.status === "success").pop();
      const txHash = orderData?.data?.executeTx?.txHash || lastSuccessfulRelayTx?.txHash;
      onSuccess?.(txHash);
      onSuccessCalled.current = true;
    }
  }, [orderData, orderId, onSuccess]);
}
