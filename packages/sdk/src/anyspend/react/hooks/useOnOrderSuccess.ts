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

  useEffect(() => {
    if (orderData?.data?.order.status === "executed" && !onSuccessCalled.current) {
      // Try to get txHash from executeTx, fallback to last successful relayTx if executeTx is null
      const txHash =
        orderData?.data?.executeTx?.txHash ||
        orderData?.data?.relayTxs?.findLast(tx => tx.status === "success")?.txHash;
      onSuccess?.(txHash);
      onSuccessCalled.current = true;
    }
  }, [orderData, onSuccess]);

  // Reset flag when orderId changes
  useEffect(() => {
    onSuccessCalled.current = false;
  }, [orderId]);
}
