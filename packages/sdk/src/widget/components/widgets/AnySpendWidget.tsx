import { useAuthStore, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { widgetManager } from "../../manager";
import { WidgetInstance } from "../../types";

/**
 * AnySpend Widget - Opens payment modal with various configurations
 */
export function AnySpendWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "anySpend",
      recipientAddress: instance.config.sellerId || undefined,
      destinationAmount: instance.config.price || undefined,
      destinationTokenAddress: instance.config.tokenAddress || undefined,
      destinationTokenChainId: instance.config.chainId ? parseInt(instance.config.chainId, 10) : undefined,
      onSuccess: txHash => {
        widgetManager.emit({
          type: "payment-success",
          widgetId: instance.id,
          widgetType: instance.type,
          data: {
            orderId: "",
            amount: instance.config.price || "",
            token: instance.config.tokenAddress || "",
            chain: instance.config.chainId || "",
            transactionHash: txHash,
          },
          timestamp: Date.now(),
        });
      },
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-anyspend">
        <p style={{ padding: "1rem", color: "#666" }}>Please sign in first to make a payment</p>
      </div>
    );
  }

  return (
    <div className="b3-widget-anyspend">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        {instance.config.productName ? `Buy ${instance.config.productName}` : "Make Payment"}
      </Button>
    </div>
  );
}
