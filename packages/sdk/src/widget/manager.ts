import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import {
  B3WidgetConfig,
  WidgetEvent,
  WidgetEventType,
  WidgetInstance,
  WidgetInstanceConfig,
  WidgetType,
} from "./types";

const debug = debugB3React("WidgetManager");

/**
 * Default configuration for B3 widgets
 */
const DEFAULT_CONFIG: Partial<B3WidgetConfig> = {
  environment: "production",
  theme: "light",
  clientType: "rest",
  automaticallySetFirstEoa: true,
  toaster: {
    position: "bottom-right",
  },
};

/**
 * Widget Manager - Handles detection, initialization, and lifecycle of all B3 widgets
 */
class WidgetManager {
  private config: B3WidgetConfig;
  private instances: Map<string, WidgetInstance> = new Map();
  private eventHandlers: Map<WidgetEventType, Set<(event: WidgetEvent) => void>> = new Map();
  private initialized = false;

  constructor() {
    // Initialize with default config (partnerId must be provided later)
    this.config = DEFAULT_CONFIG as B3WidgetConfig;
  }

  /**
   * Initialize the widget manager with configuration
   */
  init(config?: Partial<B3WidgetConfig>) {
    if (this.initialized) {
      debug("Widget manager already initialized");
      return;
    }

    // Merge with provided config
    this.config = { ...this.config, ...config };

    // Validate required config
    if (!this.config.partnerId) {
      throw new Error("B3Widget: partnerId is required in configuration");
    }

    debug("Initializing B3 Widget Manager", this.config);

    // Detect and initialize all widgets
    this.detectAndInitializeWidgets();

    // Set up mutation observer to detect dynamically added widgets
    this.observeDOMChanges();

    this.initialized = true;

    debug("B3 Widget Manager initialized with", this.instances.size, "widgets");
  }

  /**
   * Update global configuration
   */
  updateConfig(config: Partial<B3WidgetConfig>) {
    this.config = { ...this.config, ...config };
    debug("Config updated", this.config);
  }

  /**
   * Detect all B3 widgets in the DOM and initialize them
   */
  private detectAndInitializeWidgets() {
    // Find all elements with data-b3-widget attribute
    const widgetElements = document.querySelectorAll<HTMLElement>("[data-b3-widget]");

    debug("Found", widgetElements.length, "widget elements");

    widgetElements.forEach(element => {
      try {
        this.initializeWidget(element);
      } catch (error) {
        console.error("Failed to initialize widget:", error);
      }
    });
  }

  /**
   * Initialize a single widget element
   */
  private initializeWidget(element: HTMLElement) {
    // Check if already initialized
    const existingId = element.getAttribute("data-b3-widget-id");
    if (existingId && this.instances.has(existingId)) {
      debug("Widget already initialized:", existingId);
      return;
    }

    // Parse widget configuration from data attributes
    const config = this.parseWidgetConfig(element);

    // Generate unique ID
    const widgetId = config.widgetId || this.generateWidgetId(config.widgetType);
    element.setAttribute("data-b3-widget-id", widgetId);

    // Create widget instance
    const instance: WidgetInstance = {
      id: widgetId,
      type: config.widgetType,
      element,
      config,
      initialized: false,
    };

    // Store instance
    this.instances.set(widgetId, instance);

    debug("Initializing widget:", widgetId, config.widgetType);

    // Render the widget (will be implemented in widget-renderer.tsx)
    this.renderWidget(instance);
  }

  /**
   * Parse widget configuration from data attributes
   */
  private parseWidgetConfig(element: HTMLElement): WidgetInstanceConfig {
    const widgetType = element.getAttribute("data-b3-widget") as WidgetType;

    if (!widgetType) {
      throw new Error("Widget type not specified (data-b3-widget attribute missing)");
    }

    // Parse all data attributes
    const config: WidgetInstanceConfig = {
      widgetType,
      widgetId: element.getAttribute("data-b3-widget-id") || undefined,
    };

    // Sign-in widget attributes
    if (widgetType === "sign-in") {
      config.buttonText = element.getAttribute("data-b3-button-text") || undefined;
      config.loggedInButtonText = element.getAttribute("data-b3-logged-in-text") || undefined;
      config.withLogo = element.getAttribute("data-b3-with-logo") !== "false";
    }

    // AnySpend widget attributes
    if (widgetType === "anyspend") {
      config.sellerId = element.getAttribute("data-b3-seller-id") || undefined;
      config.productName = element.getAttribute("data-b3-product-name") || undefined;
      config.price = element.getAttribute("data-b3-price") || undefined;
      config.currency = element.getAttribute("data-b3-currency") || undefined;
      config.chainId = element.getAttribute("data-b3-chain-id") || undefined;
      config.tokenAddress = element.getAttribute("data-b3-token-address") || undefined;
    }

    // Content gate widget attributes
    if (widgetType === "content-gate") {
      config.gateClass = element.getAttribute("data-b3-gate-class") || undefined;
      config.gateSelector = element.getAttribute("data-b3-gate-selector") || undefined;
      config.gateThreshold = parseInt(element.getAttribute("data-b3-gate-threshold") || "3", 10);
      config.gateBlurAmount = element.getAttribute("data-b3-gate-blur") || "8px";
      config.gateHeight = element.getAttribute("data-b3-gate-height") || "400px";
      config.gateRequirePayment = element.getAttribute("data-b3-gate-require-payment") === "true";
      config.gatePrice = element.getAttribute("data-b3-gate-price") || undefined;
      config.gateCurrency = element.getAttribute("data-b3-gate-currency") || undefined;
      config.gateUnlockMessage = element.getAttribute("data-b3-gate-message") || undefined;
      config.gateButtonText = element.getAttribute("data-b3-gate-button-text") || undefined;
    }

    return config;
  }

  /**
   * Generate a unique widget ID
   */
  private generateWidgetId(type: WidgetType): string {
    return `b3-widget-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Render a widget using the widget renderer
   */
  private renderWidget(instance: WidgetInstance) {
    // Dynamically import the renderer to avoid circular dependencies
    // In production build, this will be bundled together
    import("./renderer").then(({ WidgetRenderer }) => {
      try {
        const root = WidgetRenderer.render(instance);
        instance.root = root;
        instance.initialized = true;

        debug("Widget rendered successfully:", instance.id);
      } catch (error) {
        console.error("Failed to render widget:", instance.id, error);
      }
    });
  }

  /**
   * Observe DOM changes to detect dynamically added widgets
   */
  private observeDOMChanges() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;

            // Check if the node itself is a widget
            if (element.hasAttribute("data-b3-widget")) {
              this.initializeWidget(element);
            }

            // Check for widgets in children
            const childWidgets = element.querySelectorAll<HTMLElement>("[data-b3-widget]");
            childWidgets.forEach(child => {
              this.initializeWidget(child);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Destroy a specific widget
   */
  destroy(widgetId: string) {
    const instance = this.instances.get(widgetId);
    if (!instance) {
      debug("Widget not found:", widgetId);
      return;
    }

    debug("Destroying widget:", widgetId);

    // Unmount React root if exists
    if (instance.root) {
      instance.root.unmount();
    }

    // Remove from instances
    this.instances.delete(widgetId);

    // Remove widget ID attribute
    instance.element.removeAttribute("data-b3-widget-id");
  }

  /**
   * Destroy all widgets
   */
  destroyAll() {
    debug("Destroying all widgets");
    this.instances.forEach((instance, widgetId) => {
      this.destroy(widgetId);
    });
  }

  /**
   * Emit a widget event
   */
  emit(event: WidgetEvent) {
    debug("Event emitted:", event.type, event);

    // Call global event handler if configured
    if (this.config.onEvent) {
      this.config.onEvent(event);
    }

    // Call specific event handlers
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }

    // Call specific config callbacks
    switch (event.type) {
      case "ready":
        this.config.onReady?.(event.widgetId, event.widgetType);
        break;
      case "sign-in-success":
        this.config.onSignIn?.(event.data);
        break;
      case "sign-in-error":
        this.config.onSignInError?.(event.data);
        break;
      case "payment-success":
        this.config.onPaymentSuccess?.(event.data);
        break;
      case "payment-error":
        this.config.onPaymentError?.(event.data);
        break;
      case "wallet-connected":
        this.config.onWalletConnected?.(event.data);
        break;
      case "wallet-disconnected":
        this.config.onWalletDisconnected?.();
        break;
      case "content-unlocked":
        this.config.onContentUnlocked?.(event.data);
        break;
      case "content-locked":
        this.config.onContentLocked?.(event.data);
        break;
      case "account-linked":
        this.config.onAccountLinked?.(event.data);
        break;
      case "account-unlinked":
        this.config.onAccountUnlinked?.();
        break;
    }
  }

  /**
   * Register an event handler
   */
  on(eventType: WidgetEventType, handler: (event: WidgetEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.add(handler);
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Get widget instance by ID
   */
  getInstance(widgetId: string): WidgetInstance | undefined {
    return this.instances.get(widgetId);
  }

  /**
   * Get all widget instances
   */
  getAllInstances(): WidgetInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get global config
   */
  getConfig(): B3WidgetConfig {
    return this.config;
  }
}

// Create singleton instance
export const widgetManager = new WidgetManager();

// Export for testing
export { WidgetManager };
