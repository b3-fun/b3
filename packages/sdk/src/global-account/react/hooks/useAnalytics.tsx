import { sendGA4Event } from "@b3dotfun/sdk/global-account/utils/analytics";
import { useAccountWallet } from "./useAccountWallet";

/**
 * Analytics hook that provides sendAnalyticsEvent function
 * Automatically includes user address from useAccountWallet
 */
export function useAnalytics() {
  const { address } = useAccountWallet();

  /**
   * Sends an analytics event to Google Analytics 4
   * @param eventName - The name of the event to track
   * @param parameters - Additional parameters to include with the event
   */
  const sendAnalyticsEvent = (eventName: string, parameters?: Record<string, any>) => {
    // Merge user address with custom parameters
    const eventData = {
      user_address: address,
      ...parameters,
    };

    // Send event to GA4 using utility function
    sendGA4Event(eventName, eventData);
  };

  return {
    sendAnalyticsEvent,
  };
}
