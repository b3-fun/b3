import { useAuthStore, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * Avatar Editor Widget - Opens avatar editor modal
 */
export function AvatarEditorWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "avatarEditor",
      onSuccess: () => {
        console.log("Avatar updated successfully");
      },
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-avatar-editor">
        <p style={{ padding: "1rem", color: "#666" }}>Please sign in first</p>
      </div>
    );
  }

  return (
    <div className="b3-widget-avatar-editor">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Edit Avatar
      </Button>
    </div>
  );
}
