import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * Buy Spin Widget - Opens spin wheel purchase modal
 */
export function BuySpinWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();

  const handleClick = () => {
    alert("Buy Spin widget requires spin wheel configuration");
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-buy-spin">
        <p style={{ padding: "1rem", color: "#666" }}>
          Please sign in first
        </p>
      </div>
    );
  }

  return (
    <div className="b3-widget-buy-spin">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Buy Spins
      </Button>
    </div>
  );
}

