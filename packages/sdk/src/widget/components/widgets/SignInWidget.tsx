import { SignInWithB3, useAuthStore, useB3 } from "@b3dotfun/sdk/global-account/react";
import { base } from "thirdweb/chains";
import { useEffect } from "react";
import { widgetManager } from "../../manager";
import { WidgetInstance } from "../../types";

/**
 * Sign In Widget - Renders a sign-in button that opens the authentication modal
 */
export function SignInWidget({ instance }: { instance: WidgetInstance }) {
  const { account, partnerId } = useB3();
  const { isAuthenticated } = useAuthStore();

  // Debug logging
  useEffect(() => {
    console.log("[SignInWidget] Mounted", {
      widgetId: instance.id,
      config: instance.config,
      partnerId,
    });
  }, [instance.id, instance.config, partnerId]);

  // Track authentication state changes
  useEffect(() => {
    console.log("[SignInWidget] Auth state changed:", { isAuthenticated, account });

    if (isAuthenticated && account) {
      widgetManager.emit({
        type: "sign-in-success",
        widgetId: instance.id,
        widgetType: instance.type,
        data: {
          address: account.address,
          jwt: "", // JWT would come from auth flow
        },
        timestamp: Date.now(),
      });
    }
  }, [isAuthenticated, account, instance.id, instance.type]);

  console.log("[SignInWidget] Rendering", {
    isAuthenticated,
    hasAccount: !!account,
    hasPartnerId: !!partnerId,
  });

  return (
    <div className="b3-widget-signin" onClick={() => console.log("[SignInWidget] Container clicked")}>
      <SignInWithB3
        buttonText={instance.config.buttonText}
        loggedInButtonText={instance.config.loggedInButtonText}
        withLogo={instance.config.withLogo}
        partnerId={partnerId}
        chain={base}
      />
    </div>
  );
}

