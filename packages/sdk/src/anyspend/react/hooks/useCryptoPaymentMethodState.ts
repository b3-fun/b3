import { useState } from "react";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";

interface UseCryptoPaymentMethodStateResult {
  /** Auto-selected payment method based on balance */
  cryptoPaymentMethod: CryptoPaymentMethodType;
  /** Function to update the auto-selected payment method */
  setCryptoPaymentMethod: (method: CryptoPaymentMethodType) => void;
  /** User explicitly selected payment method (NONE means no explicit selection) */
  selectedCryptoPaymentMethod: CryptoPaymentMethodType;
  /** Function to update the user-selected payment method */
  setSelectedCryptoPaymentMethod: (method: CryptoPaymentMethodType) => void;
  /** Effective payment method (user selection takes priority over auto-selection) */
  effectiveCryptoPaymentMethod: CryptoPaymentMethodType;
  /** Reset both payment method states to NONE */
  resetPaymentMethods: () => void;
}

/**
 * Custom hook to manage crypto payment method state with dual-state system:
 *
 * - `cryptoPaymentMethod`: Auto-selected based on wallet availability and balance
 * - `selectedCryptoPaymentMethod`: Explicitly selected by user
 * - `effectiveCryptoPaymentMethod`: User selection takes priority over auto-selection
 *
 * This allows automatic payment method suggestions while respecting explicit user choices.
 *
 * @example
 * ```tsx
 * const {
 *   cryptoPaymentMethod,
 *   setCryptoPaymentMethod,
 *   selectedCryptoPaymentMethod,
 *   setSelectedCryptoPaymentMethod,
 *   effectiveCryptoPaymentMethod,
 *   resetPaymentMethods
 * } = useCryptoPaymentMethodState();
 *
 * // Use effectiveCryptoPaymentMethod for display
 * // Use setSelectedCryptoPaymentMethod when user explicitly selects
 * // Call resetPaymentMethods when switching tabs or going back
 * ```
 */
export function useCryptoPaymentMethodState(): UseCryptoPaymentMethodStateResult {
  // cryptoPaymentMethod: auto-selected based on balance
  const [cryptoPaymentMethod, setCryptoPaymentMethod] = useState<CryptoPaymentMethodType>(CryptoPaymentMethodType.NONE);

  // selectedCryptoPaymentMethod: explicitly selected by user (NONE means no explicit selection)
  const [selectedCryptoPaymentMethod, setSelectedCryptoPaymentMethod] = useState<CryptoPaymentMethodType>(
    CryptoPaymentMethodType.NONE,
  );

  // The effective payment method (user selection takes priority over auto-selection)
  const effectiveCryptoPaymentMethod =
    selectedCryptoPaymentMethod !== CryptoPaymentMethodType.NONE ? selectedCryptoPaymentMethod : cryptoPaymentMethod;

  // Helper function to reset both states
  const resetPaymentMethods = () => {
    setCryptoPaymentMethod(CryptoPaymentMethodType.NONE);
    setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.NONE);
  };

  return {
    cryptoPaymentMethod,
    setCryptoPaymentMethod,
    selectedCryptoPaymentMethod,
    setSelectedCryptoPaymentMethod,
    effectiveCryptoPaymentMethod,
    resetPaymentMethods,
  };
}
