import { components } from "@b3dotfun/sdk/anyspend/types/api";

export const getStatusDisplay = (
  order: components["schemas"]["Order"],
): { text: string; status: "processing" | "success" | "failure"; description?: string } => {
  switch (order.status) {
    case "scanning_deposit_transaction":
      return {
        text: order.onrampMetadata ? "Awaiting Payment" : "Awaiting Deposit",
        status: "processing",
      };
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
      return { text: "Executing Order", status: "processing" };
    case "executed": {
      const { text, description } =
        order.type === "swap"
          ? { text: "Swap Complete", description: "Your swap has been completed successfully." }
          : order.type === "mint_nft"
            ? { text: "NFT Minted", description: "Your NFT has been minted" }
            : order.type === "join_tournament"
              ? { text: "Tournament Joined", description: "You have joined the tournament" }
              : order.type === "fund_tournament"
                ? { text: "Tournament Funded", description: "You have funded the tournament" }
                : { text: "Order Complete", description: "Your order has been completed" };
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

    default:
      throw new Error("Invalid order status");
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
