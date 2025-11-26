import { CreateOnrampOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOnrampOrder";
import { CreateOrderParams } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendCreateOrder";
import { Account, Wallet } from "thirdweb/wallets";
import { CreateConnectorFn } from "wagmi";

/**
 * Widget types supported by B3
 */
export type WidgetType = "sign-in" | "anyspend" | "content-gate" | "link-account" | "manage-account";

/**
 * Event types emitted by widgets
 */
export type WidgetEventType =
  | "ready" // Widget is initialized and ready
  | "sign-in-success" // User successfully signed in
  | "sign-in-error" // Sign in failed
  | "payment-success" // Payment completed successfully
  | "payment-error" // Payment failed
  | "wallet-connected" // Wallet connected
  | "wallet-disconnected" // Wallet disconnected
  | "content-unlocked" // Content was unlocked
  | "content-locked" // Content was locked
  | "account-linked" // Account linked successfully
  | "account-unlinked"; // Account unlinked

/**
 * Widget event structure
 */
export interface WidgetEvent<T = any> {
  type: WidgetEventType;
  widgetId: string;
  widgetType: WidgetType;
  data?: T;
  timestamp: number;
}

/**
 * Sign in event data
 */
export interface SignInEventData {
  address: string;
  jwt: string;
  wallet?: Wallet;
}

/**
 * Payment event data
 */
export interface PaymentEventData {
  orderId: string;
  amount: string;
  token: string;
  chain: string;
  transactionHash?: string;
}

/**
 * Content gate event data
 */
export interface ContentGateEventData {
  contentId: string;
  unlocked: boolean;
  reason?: string;
}

/**
 * Global B3 Widget configuration
 */
export interface B3WidgetConfig {
  // B3 Provider settings
  partnerId: string;
  environment?: "development" | "production";
  theme?: "light" | "dark";
  clientType?: "rest" | "socket";
  rpcUrls?: Record<number, string>;
  connectors?: CreateConnectorFn[];
  overrideDefaultConnectors?: boolean;
  createClientReferenceId?: (params: CreateOrderParams | CreateOnrampOrderParams) => Promise<string>;

  // Widget settings
  automaticallySetFirstEoa?: boolean;
  simDuneApiKey?: string;

  // Toaster configuration
  toaster?: {
    position?: "top-center" | "top-right" | "bottom-center" | "bottom-right";
    style?: React.CSSProperties;
  };

  // Event callbacks
  onReady?: (widgetId: string, widgetType: WidgetType) => void;
  onSignIn?: (data: SignInEventData) => void;
  onSignInError?: (error: Error) => void;
  onPaymentSuccess?: (data: PaymentEventData) => void;
  onPaymentError?: (error: Error) => void;
  onWalletConnected?: (wallet: Wallet) => void;
  onWalletDisconnected?: () => void;
  onContentUnlocked?: (data: ContentGateEventData) => void;
  onContentLocked?: (data: ContentGateEventData) => void;
  onAccountLinked?: (account: Account) => void;
  onAccountUnlinked?: () => void;

  // Global event handler (receives all events)
  onEvent?: (event: WidgetEvent) => void;
}

/**
 * Widget-specific configuration (from data attributes)
 */
export interface WidgetInstanceConfig {
  // Common
  widgetType: WidgetType;
  widgetId?: string;

  // Sign-in widget
  buttonText?: string;
  loggedInButtonText?: string;
  withLogo?: boolean;

  // AnySpend widget
  sellerId?: string;
  productName?: string;
  price?: string;
  currency?: string;
  chainId?: string;
  tokenAddress?: string;

  // Content gate widget
  gateClass?: string; // CSS class to target content
  gateSelector?: string; // CSS selector to target content
  gateThreshold?: number; // Number of paragraphs before blur (default: 3)
  gateBlurAmount?: string; // CSS blur amount (default: "8px")
  gateHeight?: string; // Height of visible content (default: "400px")
  gateRequirePayment?: boolean; // Require payment or just sign-in
  gatePrice?: string; // Price if payment required
  gateCurrency?: string; // Currency if payment required
  gateUnlockMessage?: string; // Custom message on gate
  gateButtonText?: string; // Custom button text
}

/**
 * Widget instance (combines config with DOM element)
 */
export interface WidgetInstance {
  id: string;
  type: WidgetType;
  element: HTMLElement;
  config: WidgetInstanceConfig;
  initialized: boolean;
  root?: any; // React root
}

/**
 * Window interface extension for global B3 widget API
 */
declare global {
  interface Window {
    B3Widget?: {
      config: B3WidgetConfig;
      instances: Map<string, WidgetInstance>;
      init: (config?: Partial<B3WidgetConfig>) => void;
      destroy: (widgetId: string) => void;
      destroyAll: () => void;
      emit: (event: WidgetEvent) => void;
      on: (eventType: WidgetEventType, handler: (event: WidgetEvent) => void) => () => void;
    };
  }
}
