import { B3DynamicModal, useModalStore } from "../global-account/react";
import { useEffect } from "react";

/**
 * Debug wrapper for B3DynamicModal that logs modal state
 */
export function DebugModal() {
  const { isOpen, contentType } = useModalStore();

  useEffect(() => {
    console.log("[DebugModal] Modal state changed:", {
      isOpen,
      contentType: contentType ? { ...contentType, type: contentType.type } : null,
    });
  }, [isOpen, contentType]);

  return <B3DynamicModal />;
}
