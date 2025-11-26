import { useAuthStore, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { widgetManager } from "../../manager";
import { WidgetInstance } from "../../types";

/**
 * NFT Widget - Opens NFT purchase modal
 * Note: Requires nftContract data to be passed via config
 */
export function NFTWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    // This would need nftContract data from configuration
    // For now, we'll show a placeholder
    alert("NFT widget requires nftContract configuration");
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-nft">
        <p style={{ padding: "1rem", color: "#666" }}>
          Please sign in first to purchase NFT
        </p>
      </div>
    );
  }

  return (
    <div className="b3-widget-nft">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Purchase NFT
      </Button>
    </div>
  );
}

