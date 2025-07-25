"use client";

import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useEffect } from "react";

/**
 * Handles Stripe payment redirects by showing the order details modal
 * when returning from Stripe's payment flow.
 *
 * This component should be mounted inside AnyspendProvider to ensure
 * proper modal state management.
 */
export function StripeRedirectHandler() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  useEffect(() => {
    const url = new URL(window.location.href);
    const fromStripe = url.searchParams.get("fromStripe");
    const paymentIntent = url.searchParams.get("payment_intent");
    const orderId = url.searchParams.get("orderId");

    if (fromStripe && paymentIntent && orderId) {
      // Re-open the modal with the order details
      setB3ModalOpen(true);
      setB3ModalContentType({
        type: "anyspendOrderDetails",
        orderId,
      });

      // Clean up URL params
      url.searchParams.delete("fromStripe");
      url.searchParams.delete("payment_intent");
      url.searchParams.delete("payment_intent_client_secret");
      url.searchParams.delete("redirect_status");
      window.history.replaceState({}, "", url.toString());
    }
  }, [setB3ModalOpen, setB3ModalContentType]);

  return null;
}
