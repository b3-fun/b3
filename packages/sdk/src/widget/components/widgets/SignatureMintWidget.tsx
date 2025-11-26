import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * Signature Mint Widget - Opens signature-based NFT minting modal
 */
export function SignatureMintWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();

  const handleClick = () => {
    alert("Signature Mint widget requires signature data configuration");
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-signature-mint">
        <p style={{ padding: "1rem", color: "#666" }}>
          Please sign in first
        </p>
      </div>
    );
  }

  return (
    <div className="b3-widget-signature-mint">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Mint NFT
      </Button>
    </div>
  );
}

