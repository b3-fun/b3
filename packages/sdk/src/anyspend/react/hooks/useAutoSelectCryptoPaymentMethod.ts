import { useEffect } from "react";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";
import { useConnectedWalletDisplay } from "./useConnectedWalletDisplay";

interface UseAutoSelectCryptoPaymentMethodParams {
  /** Current payment type (crypto or fiat) */
  paymentType?: "crypto" | "fiat";
  /** Currently selected payment method */
  selectedCryptoPaymentMethod: CryptoPaymentMethodType;
  /** Function to update the selected payment method */
  setSelectedCryptoPaymentMethod: (method: CryptoPaymentMethodType) => void;
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
 * - Only auto-selects when payment method is NONE (doesn't override user choices)
 * - If EOA/Wagmi wallet connected + has balance → CONNECT_WALLET
 * - If EOA/Wagmi wallet connected + insufficient balance → TRANSFER_CRYPTO
 * - If only Global wallet available → GLOBAL_WALLET
 * - If no wallets → remains NONE
 */
export function useAutoSelectCryptoPaymentMethod({
  paymentType = "crypto",
  selectedCryptoPaymentMethod,
  setSelectedCryptoPaymentMethod,
  hasEnoughBalance,
  isBalanceLoading,
}: UseAutoSelectCryptoPaymentMethodParams) {
  // Get suggested payment method based on available wallets
  const { suggestedPaymentMethod } = useConnectedWalletDisplay(selectedCryptoPaymentMethod);

  useEffect(() => {
    // Only auto-select when on crypto payment type and payment method is NONE
    if (paymentType !== "crypto" || selectedCryptoPaymentMethod !== CryptoPaymentMethodType.NONE) {
      return;
    }

    // If we have a suggested payment method (wallet is connected), use it
    if (suggestedPaymentMethod !== CryptoPaymentMethodType.NONE) {
      // If we have balance info and enough balance, use CONNECT_WALLET
      // Otherwise, default to TRANSFER_CRYPTO if balance is insufficient
      if (!isBalanceLoading) {
        if (hasEnoughBalance && suggestedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET) {
          setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
        } else if (!hasEnoughBalance && suggestedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET) {
          // Wallet connected but insufficient balance - suggest transfer
          setSelectedCryptoPaymentMethod(CryptoPaymentMethodType.TRANSFER_CRYPTO);
        } else {
          // Use suggested method (e.g., GLOBAL_WALLET)
          setSelectedCryptoPaymentMethod(suggestedPaymentMethod);
        }
      } else {
        // Balance still loading, use suggested method
        setSelectedCryptoPaymentMethod(suggestedPaymentMethod);
      }
    }
  }, [
    paymentType,
    selectedCryptoPaymentMethod,
    suggestedPaymentMethod,
    hasEnoughBalance,
    isBalanceLoading,
    setSelectedCryptoPaymentMethod,
  ]);
}

