import { useAuthStore, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React from "react";
import { WidgetInstance } from "../../types";

/**
 * Profile Editor Widget - Opens profile editor modal
 */
export function ProfileEditorWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "profileEditor",
      onSuccess: () => {
        console.log("Profile updated successfully");
      },
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="b3-widget-profile-editor">
        <p style={{ padding: "1rem", color: "#666" }}>Please sign in first</p>
      </div>
    );
  }

  return (
    <div className="b3-widget-profile-editor">
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="flex items-center gap-2 text-white"
      >
        Edit Profile
      </Button>
    </div>
  );
}
