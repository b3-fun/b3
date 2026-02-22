import type { ReactNode } from "react";
import type {
  CheckoutFormComponentProps,
  ShippingSelectorSlotProps,
  DiscountInputSlotProps,
} from "../../../types/forms";

// === SLOT PROP INTERFACES ===

export interface ActionButtonSlotProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  text: string;
}

export interface ConnectWalletButtonSlotProps {
  onPayment: () => void;
  txLoading: boolean;
  connectedAddress?: string;
  paymentLabel: string;
}

export interface SuccessScreenSlotProps {
  title: string;
  description: string;
  txHash?: string;
  orderId?: string;
  explorerUrl?: string;
  onDone: () => void;
  returnUrl?: string;
  returnLabel?: string;
}

export interface ErrorScreenSlotProps {
  title: string;
  description: string;
  errorType: "failure" | "expired" | "refunded";
  orderId?: string;
  onRetry?: () => void;
  onDone?: () => void;
}

// === SLOTS (element replacement) ===

export interface AnySpendSlots {
  actionButton?: (props: ActionButtonSlotProps) => ReactNode;
  connectWalletButton?: (props: ConnectWalletButtonSlotProps) => ReactNode;
  header?: (props: { mode: "page" | "modal" }) => ReactNode;
  footer?: ReactNode;
  successScreen?: (props: SuccessScreenSlotProps) => ReactNode;
  errorScreen?: (props: ErrorScreenSlotProps) => ReactNode;
  /** Replace the entire checkout form panel with a custom component */
  checkoutForm?: (props: CheckoutFormComponentProps) => ReactNode;
  /** Replace the shipping method selector */
  shippingSelector?: (props: ShippingSelectorSlotProps) => ReactNode;
  /** Replace the discount code input */
  discountInput?: (props: DiscountInputSlotProps) => ReactNode;
}

// === CONTENT (text/message overrides) ===

export interface AnySpendContent {
  // Success states
  successTitle?: string | ReactNode;
  successDescription?: string | ReactNode;

  // Error states
  failureTitle?: string | ReactNode;
  failureDescription?: string | ReactNode;
  expiredTitle?: string | ReactNode;
  expiredDescription?: string | ReactNode;
  refundedTitle?: string | ReactNode;
  refundedDescription?: string | ReactNode;

  // Processing states
  processingTitle?: string | ReactNode;
  processingDescription?: string | ReactNode;

  // Buttons
  returnButtonLabel?: string;
  retryButtonLabel?: string;
}

// === THEME ===

export interface AnySpendTheme {
  brandColor?: string;
  colors?: Partial<{
    primary: string;
    secondary: string;
    tertiary: string;
    surfacePrimary: string;
    surfaceSecondary: string;
    brand: string;
    borderPrimary: string;
    borderSecondary: string;
  }>;
}
