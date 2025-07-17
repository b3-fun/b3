import { getChainName } from "@b3dotfun/sdk/anyspend";
import { Badge, useTokenData } from "@b3dotfun/sdk/global-account/react";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { CheckIcon, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

interface WebviewOnrampOrderStatusProps {
  order: components["schemas"]["Order"];
}

export function WebviewOnrampOrderStatus({ order }: WebviewOnrampOrderStatusProps) {
  console.log(order.status);
  const isPending =
    order.status === "waiting_stripe_payment" ||
    order.status === "scanning_deposit_transaction" ||
    order.status === "sending_token_from_vault" ||
    order.status === "relay";
  const isExecuted = order.status === "executed";
  const isFailed = order.status === "failure";
  const isRefunded = order.status === "refunded";

  // Get token metadata
  const { data: tokenMetadata } = useTokenData(order.metadata.dstToken.chainId, order.metadata.dstToken.address);

  // Only show expected amount for swap orders
  const expectedAmount =
    order.type === "swap"
      ? Number(formatUnits(BigInt(order.payload.expectedDstAmount), order.metadata.dstToken.decimals)).toFixed(2)
      : null;

  // Use token metadata logo if available
  const tokenLogoUrl = tokenMetadata?.logoURI || order.metadata.dstToken.metadata?.logoURI;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6">
      {/* Status Badge */}
      <div className="flex justify-center">
        <Badge variant="default" className="flex items-center gap-3 px-4 py-2 text-base">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isExecuted && <CheckIcon className="h-4 w-4 text-green-500" />}
          {isFailed && <ExternalLink className="h-4 w-4 text-red-500" />}
          <span>
            {isPending && "Processing Payment..."}
            {isExecuted && "Payment Complete"}
            {isFailed && "Payment Failed"}
            {isRefunded && "Payment Refunded"}
          </span>
        </Badge>
      </div>

      {/* Order Summary Card */}
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="px-6 py-4">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          <div className="flex flex-col divide-y">
            {/* Amount Paid */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Amount Paid</span>
              <span className="text-lg font-semibold">
                ${Number(formatUnits(BigInt(order.srcAmount), order.metadata.srcToken.decimals)).toFixed(2)}
              </span>
            </div>

            {/* Receiving Amount - Only show for swap orders */}
            {order.type === "swap" && expectedAmount && (
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Est Token Amount</span>
                <div className="flex items-center gap-2">
                  {tokenLogoUrl && (
                    <img src={tokenLogoUrl} alt={order.metadata.dstToken.symbol} className="h-5 w-5 rounded-full" />
                  )}
                  <span className="font-medium">
                    {expectedAmount} {order.metadata.dstToken.symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Network */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Network</span>
              <span className="font-medium">{getChainName(order.dstChain)}</span>
            </div>

            {/* Recipient */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Recipient</span>
              <button
                onClick={() => handleCopy(order.recipientAddress, "Recipient address")}
                className="flex items-center gap-2 font-medium transition-colors hover:text-blue-600"
              >
                {centerTruncate(order.recipientAddress, 8)}
                <Copy className="h-4 w-4" />
              </button>
            </div>

            {/* Order ID */}
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Order ID</span>
              <button
                onClick={() => handleCopy(order.id, "Order ID")}
                className="flex items-center gap-2 font-medium transition-colors hover:text-blue-600"
              >
                {centerTruncate(order.id, 8)}
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
