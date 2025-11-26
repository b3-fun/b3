import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * BondKit Widget - Opens BondKit token purchase modal
 */
export function BondKitWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();

  const handleClick = () => {
    alert("BondKit widget requires contract configuration");
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-bondkit">
        <p style={{ padding: "1rem", color: "#666" }}>Please sign in first</p>
      </div>
    );
  }

  return (
    <div className="b3-widget-bondkit">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Buy BondKit Tokens
      </Button>
    </div>
  );
}
