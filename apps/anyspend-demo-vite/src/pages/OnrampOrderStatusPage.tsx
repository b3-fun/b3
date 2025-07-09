import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend";
import { WebviewOnrampOrderStatus } from "@b3dotfun/sdk/anyspend/react";
import { useSearchParams } from "react-router-dom";

export default function OnrampOrderStatusPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  const { orderAndTransactions: oat, getOrderAndTransactionsError } = useAnyspendOrderAndTransactions(
    true, // isMainnet
    orderId || undefined,
  );

  if (getOrderAndTransactionsError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">Error: {getOrderAndTransactionsError.message}</div>
      </div>
    );
  }

  if (!oat) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WebviewOnrampOrderStatus order={oat.data.order} />
    </div>
  );
}
