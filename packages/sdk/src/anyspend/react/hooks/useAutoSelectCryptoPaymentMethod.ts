import { useEffect } from "react";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";
import { useConnectedWalletDisplay } from "./useConnectedWalletDisplay";

interface UseAutoSelectCryptoPaymentMethodParams {
  /** Current payment type (crypto or fiat) */
  paymentType?: "crypto" | "fiat";
  /** Auto-selected payment method based on balance (not used in hook logic, but part of state management) */
  cryptoPaymentMethod: CryptoPaymentMethodType;
  /** Function to update the auto-selected payment method */
  setCryptoPaymentMethod: (method: CryptoPaymentMethodType) => void;
  /** User explicitly selected payment method (NONE means no explicit selection) */
  selectedCryptoPaymentMethod: CryptoPaymentMethodType;
  /** Whether user has enough balance to pay */
  hasEnoughBalance: boolean;
  /** Whether balance is still loading */
  isBalanceLoading: boolean;
}

/**
 * Custom hook to automatically select appropriate crypto payment method
 * based on available wallets and balance.
 *
 * Auto-selection logic:
 * - Only auto-selects when selectedCryptoPaymentMethod is NONE (user hasn't explicitly chosen)
 * - If EOA/Wagmi wallet connected + has balance → CONNECT_WALLET
 * - If EOA/Wagmi wallet connected + insufficient balance → TRANSFER_CRYPTO
 * - If only Global wallet available → GLOBAL_WALLET
 * - If no wallets → remains NONE
 */
export function useAutoSelectCryptoPaymentMethod({
  paymentType = "crypto",
  cryptoPaymentMethod: _cryptoPaymentMethod,
  setCryptoPaymentMethod,
  selectedCryptoPaymentMethod,
  hasEnoughBalance,
  isBalanceLoading,
}: UseAutoSelectCryptoPaymentMethodParams) {
  // Get suggested payment method based on available wallets
  const { suggestedPaymentMethod } = useConnectedWalletDisplay(selectedCryptoPaymentMethod);

  useEffect(() => {
    // Only auto-select when on crypto payment type
    if (paymentType !== "crypto") {
      return;
    }

    // Only auto-switch if user hasn't explicitly selected a payment method
    if (selectedCryptoPaymentMethod !== CryptoPaymentMethodType.NONE) {
      return;
    }

    // If we have a suggested payment method (wallet is connected), use it
    if (suggestedPaymentMethod !== CryptoPaymentMethodType.NONE) {
      // If we have balance info and enough balance, use CONNECT_WALLET
      // Otherwise, default to TRANSFER_CRYPTO if balance is insufficient
      if (!isBalanceLoading) {
        if (hasEnoughBalance && suggestedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET) {
          setCryptoPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
        } else if (!hasEnoughBalance && suggestedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET) {
          // Wallet connected but insufficient balance - suggest transfer
          setCryptoPaymentMethod(CryptoPaymentMethodType.TRANSFER_CRYPTO);
        } else {
          // Use suggested method (e.g., GLOBAL_WALLET)
          setCryptoPaymentMethod(suggestedPaymentMethod);
        }
      } else {
        // Balance still loading, use suggested method
        setCryptoPaymentMethod(suggestedPaymentMethod);
      }
    }
  }, [
    paymentType,
    setCryptoPaymentMethod,
    selectedCryptoPaymentMethod,
    suggestedPaymentMethod,
    hasEnoughBalance,
    isBalanceLoading,
  ]);
}
