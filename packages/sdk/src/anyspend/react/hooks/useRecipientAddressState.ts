import { useEffect, useState } from "react";

interface UseRecipientAddressStateProps {
  /** Fixed recipient address from props (highest priority) */
  recipientAddressFromProps?: string;
  /** Connected wallet address from payment method */
  walletAddress?: string;
  /** Global account address */
  globalAddress?: string;
}

interface UseRecipientAddressStateResult {
  /** User explicitly selected recipient address (undefined means no explicit selection) */
  selectedRecipientAddress: string | undefined;
  /** Function to update the user-selected recipient address */
  setSelectedRecipientAddress: (address: string | undefined) => void;
  /** Effective recipient address (follows priority: props > user selection > wallet/global) */
  effectiveRecipientAddress: string | undefined;
  /** Reset recipient address state */
  resetRecipientAddress: () => void;
}

/**
 * Custom hook to manage recipient address state with automatic priority handling:
 *
 * **Priority System:**
 * 1. `recipientAddressFromProps` - Fixed recipient from component props (highest priority)
 * 2. `selectedRecipientAddress` - User's explicit manual selection
 * 3. `walletAddress` or `globalAddress` - Auto-selected fallback
 *
 * **Key Features:**
 * - Automatically manages recipient address based on priority
 * - Preserves user's manual selections
 * - Updates automatically when wallet/global address changes (if no manual selection)
 * - Self-contained logic - no need for useEffect in parent components
 *
 * @example
 * ```tsx
 * const {
 *   selectedRecipientAddress,
 *   setSelectedRecipientAddress,
 *   effectiveRecipientAddress,
 *   resetRecipientAddress
 * } = useRecipientAddressState({
 *   recipientAddressFromProps,
 *   walletAddress,
 *   globalAddress,
 * });
 *
 * // Use effectiveRecipientAddress for display and operations
 * // Use setSelectedRecipientAddress when user explicitly selects
 * // Call resetRecipientAddress when switching tabs or going back
 * ```
 */
export function useRecipientAddressState({
  recipientAddressFromProps,
  walletAddress,
  globalAddress,
}: UseRecipientAddressStateProps = {}): UseRecipientAddressStateResult {
  // recipientAddress: auto-selected based on wallet/global address
  const [recipientAddress, setRecipientAddress] = useState<string | undefined>(undefined);

  // selectedRecipientAddress: explicitly selected by user (undefined means no explicit selection)
  const [selectedRecipientAddress, setSelectedRecipientAddress] = useState<string | undefined>(undefined);

  // Auto-update recipient address from wallet/global when no manual selection exists
  useEffect(() => {
    // Don't auto-update if user has made an explicit selection
    if (selectedRecipientAddress) {
      return;
    }

    // Auto-set from wallet or global address
    const autoRecipient = walletAddress || globalAddress;
    if (autoRecipient) {
      setRecipientAddress(autoRecipient);
    }
  }, [selectedRecipientAddress, walletAddress, globalAddress]);

  // The effective recipient address (user selection takes priority over auto-selection)
  const effectiveRecipientAddress = recipientAddressFromProps || selectedRecipientAddress || recipientAddress;

  // Helper function to reset both states
  const resetRecipientAddress = () => {
    setRecipientAddress(undefined);
    setSelectedRecipientAddress(undefined);
  };

  return {
    selectedRecipientAddress,
    setSelectedRecipientAddress,
    effectiveRecipientAddress,
    resetRecipientAddress,
  };
}
