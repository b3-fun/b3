import { Order, OrderStatus, OrderType } from "@b3dotfun/sdk/anyspend/types";

export const getStatusDisplay = (order: Order): { text: string; status: "processing" | "success" | "failure" } => {
  switch (order.status) {
    case OrderStatus.ScanningDepositTransaction:
      return {
        text: order.onrampMetadata ? "Awaiting Payment" : "Awaiting Deposit",
        status: "processing",
      };
    case OrderStatus.WaitingStripePayment:
      return {
        text: "Awaiting Payment",
        status: "processing",
      };

    case OrderStatus.Expired:
      return { text: "Order Expired", status: "failure" };

    case OrderStatus.SendingTokenFromVault:
      return { text: "Sending Token", status: "processing" };

    case OrderStatus.Relay:
      return { text: "Executing Order", status: "processing" };
    case OrderStatus.Executed: {
      const text =
        order.type === OrderType.Swap
          ? "Swap Complete"
          : order.type === OrderType.MintNFT
            ? "NFT Minted"
            : order.type === OrderType.JoinTournament
              ? "Tournament Joined"
              : order.type === OrderType.FundTournament
                ? "Tournament Funded"
                : "Order Complete";
      return { text, status: "success" };
    }

    case OrderStatus.Refunding:
      return { text: "Order Refunding", status: "processing" };
    case OrderStatus.Refunded:
      return { text: "Order Refunded", status: "failure" };

    case OrderStatus.Failure:
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
