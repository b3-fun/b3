import { useAuthStore, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { ManageAccountButton } from "@b3dotfun/sdk/global-account/react/components/custom/ManageAccountButton";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * Manage Account Widget - Renders a button that opens the account management modal
 */
export function ManageAccountWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "manageAccount",
      chain: undefined as any, // Will use default chain
      partnerId: widgetManager.getConfig().partnerId,
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-manage-account">
        <button
          onClick={handleClick}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3368ef",
            color: "white",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Sign in to manage account
        </button>
      </div>
    );
  }

  return (
    <div className="b3-widget-manage-account">
      <ManageAccountButton />
    </div>
  );
}

