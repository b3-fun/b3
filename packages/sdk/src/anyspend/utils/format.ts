import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";

export const getStatusDisplay = (
  order: components["schemas"]["Order"],
): { text: string; status: "processing" | "success" | "failure"; description?: string } => {
  const srcToken = order.metadata?.srcToken;
  const dstToken = order.metadata?.dstToken;
  const formattedSrcAmount = srcToken
    ? formatTokenAmount(BigInt(order.srcAmount), srcToken.decimals)
    : undefined;
  const actualDstAmount = order.settlement?.actualDstAmount;
  const formattedActualDstAmount =
    actualDstAmount && dstToken ? formatTokenAmount(BigInt(actualDstAmount), dstToken.decimals) : undefined;

  switch (order.status) {
    case "scanning_deposit_transaction": {
      const depositText =
        formattedSrcAmount && srcToken
          ? `Awaiting ${formattedSrcAmount} ${srcToken.symbol}`
          : order.onrampMetadata
            ? "Awaiting Payment"
            : "Awaiting Deposit";
      return {
        text: depositText,
        status: "processing",
      };
    }
    case "waiting_stripe_payment":
      return {
        text: "Awaiting Payment",
        status: "processing",
        description: "Complete your payment securely with Stripe to move forward",
      };

    case "expired":
      return {
        text: "Order Expired",
        status: "failure",
        description: "This order is no longer valid because the order expired.",
      };

    case "sending_token_from_vault":
      return { text: "Sending Token", status: "processing" };

    case "relay":
    case "executing":
      return {
        text: "Executing Order",
        status: "processing",
        description: "It will take approximately one minute to complete.",
      };
    case "executed": {
      const receivedText =
        formattedActualDstAmount && dstToken ? `Received ${formattedActualDstAmount} ${dstToken.symbol}` : undefined;
      const { text, description } =
        order.type === "swap"
          ? { text: receivedText || "Swap Complete", description: "Your swap has been completed successfully." }
          : order.type === "mint_nft"
            ? { text: "NFT Minted", description: "Your NFT has been minted" }
            : order.type === "join_tournament"
              ? { text: "Tournament Joined", description: "You have joined the tournament" }
              : order.type === "fund_tournament"
                ? { text: "Tournament Funded", description: "You have funded the tournament" }
                : { text: receivedText || "Order Complete", description: "Your order has been completed" };
      return { text, status: "success", description };
    }

    case "refunding":
      return { text: "Order Refunding", status: "processing" };
    case "refunded":
      return { text: "Order Refunded", status: "failure" };

    case "failure":
      return {
        text: "Order Failure",
        status: "failure",
        description: "This order has failed. Please try again or contact support.",
      };

    case "quoting_after_deposit": {
      return {
        text: "Quoting After Deposit",
        status: "processing",
        description: "Getting quote for the order",
      };
    }

    default:
      return {
        text: order.status,
        status: "processing",
      };
  }
};

export const getErrorDisplay = (errorDetails: string): string => {
  switch (errorDetails) {
    case "SLIPPAGE":
      return "The order failed due to price movement exceeding slippage tolerance";
    default: {
      return "The order failed. Please try again or contact support";
    }
  }
};
