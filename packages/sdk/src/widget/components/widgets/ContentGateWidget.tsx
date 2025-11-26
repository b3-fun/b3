import { useAuthStore, useB3, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/ui/button";
import React, { useCallback, useEffect, useState } from "react";
import { widgetManager } from "../../manager";
import { WidgetInstance } from "../../types";

/**
 * Content Gate Widget - Gates content behind sign-in or payment
 * 
 * Features:
 * - Finds content by CSS selector or class
 * - Hides content after threshold (e.g., 3 paragraphs)
 * - Adds blur effect to hidden content
 * - Shows unlock UI
 * - Requires sign-in or payment to unlock
 * - Preserves scripts, tables, and complex elements
 */
export function ContentGateWidget({ instance }: { instance: WidgetInstance }) {
  const { isAuthenticated } = useAuthStore();
  const { account } = useB3();
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);

  // Configuration
  const {
    gateSelector,
    gateClass,
    gateThreshold = 3,
    gateBlurAmount = "8px",
    gateHeight = "400px",
    gateRequirePayment = false,
    gatePrice,
    gateCurrency = "USD",
    gateUnlockMessage = "Unlock this content",
    gateButtonText,
  } = instance.config;

  // Find content element
  useEffect(() => {
    let element: HTMLElement | null = null;

    if (gateSelector) {
      element = document.querySelector<HTMLElement>(gateSelector);
    } else if (gateClass) {
      element = document.querySelector<HTMLElement>(`.${gateClass}`);
    }

    if (element) {
      setContentElement(element);
    } else {
      console.warn("Content Gate: Content element not found");
    }
  }, [gateSelector, gateClass]);

  // Apply content gate effect
  useEffect(() => {
    if (!contentElement || isUnlocked) return;

    // Store original styles
    const originalOverflow = contentElement.style.overflow;
    const originalHeight = contentElement.style.height;
    const originalPosition = contentElement.style.position;

    // Apply content gate effect
    applyContentGateEffect(contentElement, {
      threshold: gateThreshold,
      blurAmount: gateBlurAmount,
      height: gateHeight,
    });

    // Emit locked event
    widgetManager.emit({
      type: "content-locked",
      widgetId: instance.id,
      widgetType: instance.type,
      data: {
        contentId: gateSelector || gateClass || "unknown",
        unlocked: false,
      },
      timestamp: Date.now(),
    });

    // Cleanup function
    return () => {
      if (contentElement) {
        contentElement.style.overflow = originalOverflow;
        contentElement.style.height = originalHeight;
        contentElement.style.position = originalPosition;
        
        // Remove content gate overlay
        const overlay = contentElement.querySelector(".b3-content-gate-overlay");
        if (overlay) {
          overlay.remove();
        }
      }
    };
  }, [contentElement, isUnlocked, gateThreshold, gateBlurAmount, gateHeight, gateSelector, gateClass, instance.id, instance.type]);

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    
    // Remove blur and overlay
    if (contentElement) {
      removeContentGateEffect(contentElement);
    }

    // Emit unlocked event
    widgetManager.emit({
      type: "content-unlocked",
      widgetId: instance.id,
      widgetType: instance.type,
      data: {
        contentId: gateSelector || gateClass || "unknown",
        unlocked: true,
      },
      timestamp: Date.now(),
    });
  }, [contentElement, instance.id, instance.type, gateSelector, gateClass]);

  // Handle authentication state change
  useEffect(() => {
    if (isAuthenticated && !gateRequirePayment) {
      handleUnlock();
    }
  }, [isAuthenticated, gateRequirePayment, handleUnlock]);

  const handleSignIn = () => {
    setB3ModalContentType({
      type: "signInWithB3",
      chain: undefined as any,
      partnerId: widgetManager.getConfig().partnerId,
      onLoginSuccess: () => {
        if (!paywallRequirePayment) {
          handleUnlock();
        }
      },
    });
    setB3ModalOpen(true);
  };

  const handlePayment = () => {
    if (!isAuthenticated) {
      handleSignIn();
      return;
    }

    setB3ModalContentType({
      type: "anySpend",
      destinationAmount: gatePrice,
      onSuccess: () => {
        handleUnlock();
      },
    });
    setB3ModalOpen(true);
  };

  // If unlocked, don't render anything
  if (isUnlocked) {
    return null;
  }

  // Render unlock UI
  return (
    <div className="b3-widget-content-gate" style={{
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      zIndex: 9999,
      backgroundColor: "white",
      padding: "1.5rem",
      borderRadius: "0.75rem",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      maxWidth: "320px",
    }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {gateUnlockMessage}
        </h3>
        {gateRequirePayment && gatePrice && (
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
            {gatePrice} {gateCurrency}
          </p>
        )}
      </div>

      <Button
        onClick={gateRequirePayment ? handlePayment : handleSignIn}
        style={{ backgroundColor: "#3368ef", width: "100%" }}
        className="flex items-center justify-center gap-2 text-white"
      >
        {gateButtonText || (gateRequirePayment ? "Unlock with Payment" : "Sign in to Unlock")}
      </Button>

      {!isAuthenticated && gateRequirePayment && (
        <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.75rem", color: "#999", textAlign: "center" }}>
          Sign in required before payment
        </p>
      )}
    </div>
  );
}

/**
 * Apply content gate effect to content element
 */
function applyContentGateEffect(
  element: HTMLElement,
  options: { threshold: number; blurAmount: string; height: string }
) {
  // Find paragraphs and similar content elements
  const contentElements = Array.from(
    element.querySelectorAll<HTMLElement>("p, li, div:not(.b3-content-gate-overlay)")
  );

  // Calculate where to start blurring (skip first N elements based on threshold)
  const hiddenElements = contentElements.slice(options.threshold);

  // Apply blur to hidden elements
  hiddenElements.forEach(el => {
    el.style.filter = `blur(${options.blurAmount})`;
    el.style.userSelect = "none";
    el.style.pointerEvents = "none";
  });

  // Set container height and overflow
  element.style.position = "relative";
  element.style.maxHeight = options.height;
  element.style.overflow = "hidden";

  // Add gradient overlay
  const overlay = document.createElement("div");
  overlay.className = "b3-content-gate-overlay";
  overlay.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(to bottom, transparent, white);
    pointer-events: none;
    z-index: 1;
  `;
  element.appendChild(overlay);
}

/**
 * Remove content gate effect from content element with smooth animation
 */
function removeContentGateEffect(element: HTMLElement) {
  // Add transition for smooth animation
  element.style.transition = "max-height 0.8s ease-out";
  
  // Fade out overlay first
  const overlay = element.querySelector<HTMLElement>(".b3-content-gate-overlay");
  if (overlay) {
    overlay.style.transition = "opacity 0.5s ease-out";
    overlay.style.opacity = "0";
    
    // Remove after animation
    setTimeout(() => overlay.remove(), 500);
  }

  // Animate blur removal
  const blurredElements = element.querySelectorAll<HTMLElement>("[style*='blur']");
  blurredElements.forEach(el => {
    el.style.transition = "filter 0.6s ease-out";
    el.style.filter = "blur(0px)";
    
    // Remove blur style after animation
    setTimeout(() => {
      el.style.filter = "";
      el.style.userSelect = "";
      el.style.pointerEvents = "";
      el.style.transition = "";
    }, 600);
  });

  // Expand height with animation
  const currentHeight = element.scrollHeight;
  element.style.maxHeight = `${currentHeight}px`;
  
  // Trigger reflow
  element.offsetHeight;
  
  // Expand to full height
  setTimeout(() => {
    element.style.maxHeight = "none";
    element.style.overflow = "visible";
    
    // Clean up after animation
    setTimeout(() => {
      element.style.transition = "";
      element.style.position = "";
    }, 800);
  }, 50);
}

