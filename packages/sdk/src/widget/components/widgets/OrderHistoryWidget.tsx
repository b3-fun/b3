import { useAuthStore, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * Order History Widget - Opens the order history modal
 */
export function OrderHistoryWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "anySpendOrderHistory",
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-order-history">
        <p style={{ padding: "1rem", color: "#666" }}>Please sign in to view order history</p>
      </div>
    );
  }

  return (
    <div className="b3-widget-order-history">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        View Order History
      </Button>
    </div>
  );
}
