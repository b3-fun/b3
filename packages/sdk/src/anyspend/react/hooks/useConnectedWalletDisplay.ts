import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useAccount } from "wagmi";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";

interface UseConnectedWalletDisplayResult {
  walletAddress: string | undefined;
  shouldShowConnectedEOA: boolean;
  suggestedPaymentMethod: CryptoPaymentMethodType;
}

/**
 * Custom hook to determine which wallet to display and its address
 * Handles logic for showing EOA wallet, wagmi wallet, or global wallet based on payment method
 */
export function useConnectedWalletDisplay(
  selectedCryptoPaymentMethod?: CryptoPaymentMethodType,
): UseConnectedWalletDisplayResult {
  const { connectedEOAWallet, connectedSmartWallet } = useAccountWallet();
  const { address: wagmiAddress } = useAccount();

  const globalWalletAddress = connectedSmartWallet?.getAccount()?.address;

  // Check if connectedEOAWallet and wagmi wallet represent the same wallet
  const connectedEOAAddress = connectedEOAWallet?.getAccount()?.address;

  // Determine which wallet to show (prefer connectedEOAWallet if both exist and are the same)
  const shouldShowConnectedEOA = !!connectedEOAWallet;
  // this is disabled because we don't want to display In-App Wallet as a payment method

  // Determine which address to use based on payment method
  let walletAddress: string | undefined;

  if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET) {
    walletAddress = globalWalletAddress;
  } else if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET) {
    // Prefer connectedEOAWallet, fallback to wagmi wallet
    walletAddress = connectedEOAAddress || wagmiAddress;
  } else {
    // Default behavior: use connectedEOAWallet if available, otherwise wagmi
    walletAddress = connectedEOAAddress || wagmiAddress;
  }

  // Suggest a payment method based on available wallets
  // Priority: Connected EOA/Wagmi wallet > Global wallet > None
  let suggestedPaymentMethod = CryptoPaymentMethodType.NONE;

  if (connectedEOAAddress || wagmiAddress) {
    // If there's a connected EOA or wagmi wallet, suggest CONNECT_WALLET
    suggestedPaymentMethod = CryptoPaymentMethodType.CONNECT_WALLET;
  } else if (globalWalletAddress) {
    // If only global wallet is available, suggest that
    suggestedPaymentMethod = CryptoPaymentMethodType.GLOBAL_WALLET;
  }

  return {
    walletAddress,
    shouldShowConnectedEOA,
    suggestedPaymentMethod,
  };
}
