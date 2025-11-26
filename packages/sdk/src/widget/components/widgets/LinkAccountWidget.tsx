import { useAuthStore, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { widgetManager } from "../../manager";
import { WidgetInstance } from "../../types";

/**
 * Link Account Widget - Opens the link account modal
 */
export function LinkAccountWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "linkAccount",
      chain: undefined as any, // Will use default chain
      partnerId: widgetManager.getConfig().partnerId,
      onSuccess: () => {
        widgetManager.emit({
          type: "account-linked",
          widgetId: instance.id,
          widgetType: instance.type,
          data: undefined,
          timestamp: Date.now(),
        });
      },
      onError: error => {
        console.error("Link account error:", error);
      },
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-link-account">
        <p style={{ padding: "1rem", color: "#666" }}>Please sign in first to link accounts</p>
      </div>
    );
  }

  return (
    <div className="b3-widget-link-account">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Link Account
      </Button>
    </div>
  );
}
