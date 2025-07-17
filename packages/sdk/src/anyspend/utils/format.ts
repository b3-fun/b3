import { components } from "@b3dotfun/sdk/anyspend/types/api";

export const getStatusDisplay = (
  order: components["schemas"]["Order"],
): { text: string; status: "processing" | "success" | "failure" } => {
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
      };

    case "expired":
      return { text: "Order Expired", status: "failure" };

    case "sending_token_from_vault":
      return { text: "Sending Token", status: "processing" };

    case "relay":
      return { text: "Executing Order", status: "processing" };
    case "executed": {
      const text =
        order.type === "swap"
          ? "Swap Complete"
          : order.type === "mint_nft"
            ? "NFT Minted"
            : order.type === "join_tournament"
              ? "Tournament Joined"
              : order.type === "fund_tournament"
                ? "Tournament Funded"
                : "Order Complete";
      return { text, status: "success" };
    }

    case "refunding":
      return { text: "Order Refunding", status: "processing" };
    case "refunded":
      return { text: "Order Refunded", status: "failure" };

    case "failure":
      return { text: "Order Failure", status: "failure" };

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
