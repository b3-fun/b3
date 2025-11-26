import { useAuthStore, useB3, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { widgetManager } from "../../manager";
import { WidgetInstance } from "../../types";

/**
 * Stake B3 Widget - Opens B3 staking modal
 */
export function StakeB3Widget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { account } = useB3();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "anySpendStakeB3",
      recipientAddress: account?.address || "",
      stakeAmount: instance.config.price || undefined,
      onSuccess: () => {
        widgetManager.emit({
          type: "payment-success",
          widgetId: instance.id,
          widgetType: instance.type,
          data: {
            orderId: "",
            amount: instance.config.price || "",
            token: "B3",
            chain: "base",
          },
          timestamp: Date.now(),
        });
      },
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-stake-b3">
        <p style={{ padding: "1rem", color: "#666" }}>
          Please sign in first to stake B3
        </p>
      </div>
    );
  }

  return (
    <div className="b3-widget-stake-b3">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Stake B3
      </Button>
    </div>
  );
}

