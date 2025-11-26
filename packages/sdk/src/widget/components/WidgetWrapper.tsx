import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";
import { useEffect } from "react";
import { widgetManager } from "../manager";
import { WidgetInstance } from "../types";
import { AnySpendWidget } from "./widgets/AnySpendWidget";
import { ContentGateWidget } from "./widgets/ContentGateWidget";
import { LinkAccountWidget } from "./widgets/LinkAccountWidget";
import { ManageAccountWidget } from "./widgets/ManageAccountWidget";
import { SignInWidget } from "./widgets/SignInWidget";

/**
 * Widget wrapper component that provides B3Provider context
 * and renders the appropriate widget content
 *
 * Each widget gets its own B3Provider instance (independent)
 */
export function WidgetWrapper({ instance }: { instance: WidgetInstance }) {
  const config = widgetManager.getConfig();

  // Debug logging
  useEffect(() => {
    console.log("[WidgetWrapper] Mounted", {
      widgetId: instance.id,
      widgetType: instance.type,
      config,
    });
  }, []);

  // Emit ready event on mount
  useEffect(() => {
    console.log("[WidgetWrapper] Emitting ready event");
    widgetManager.emit({
      type: "ready",
      widgetId: instance.id,
      widgetType: instance.type,
      timestamp: Date.now(),
    });
  }, [instance.id, instance.type]);

  // Render widget content based on type
  const renderWidgetContent = () => {
    switch (instance.type) {
      case "sign-in":
        return <SignInWidget instance={instance} />;
      case "manage-account":
        return <ManageAccountWidget instance={instance} />;
      case "link-account":
        return <LinkAccountWidget instance={instance} />;
      case "anyspend":
        return <AnySpendWidget instance={instance} />;
      case "content-gate":
        return <ContentGateWidget instance={instance} />;
      default:
        return <div style={{ padding: "1rem", color: "red" }}>Unknown widget type: {instance.type}</div>;
    }
  };

  console.log("[WidgetWrapper] Rendering", {
    widgetType: instance.type,
    hasPartnerId: !!config.partnerId,
  });

  return (
    <B3Provider
      theme={config.theme || "light"}
      environment={config.environment || "production"}
      automaticallySetFirstEoa={config.automaticallySetFirstEoa}
      simDuneApiKey={config.simDuneApiKey}
      toaster={config.toaster}
      clientType={config.clientType || "rest"}
      rpcUrls={config.rpcUrls}
      partnerId={config.partnerId}
      connectors={config.connectors}
      overrideDefaultConnectors={config.overrideDefaultConnectors}
      createClientReferenceId={config.createClientReferenceId}
      onConnect={(wallet, jwt) => {
        console.log("[WidgetWrapper] Wallet connected", wallet);
        widgetManager.emit({
          type: "wallet-connected",
          widgetId: instance.id,
          widgetType: instance.type,
          data: wallet,
          timestamp: Date.now(),
        });

        // Call global callback
        config.onWalletConnected?.(wallet);
      }}
    >
      {renderWidgetContent()}
      {/* Each widget gets its own modal instance */}
      <B3DynamicModal />
    </B3Provider>
  );
}
