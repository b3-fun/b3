import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useAccount } from "wagmi";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";

interface UseConnectedWalletDisplayResult {
  walletAddress: string | undefined;
  shouldShowConnectedEOA: boolean;
  shouldShowWagmiWallet: boolean;
  isWalletDuplicated: boolean;
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
  const { address: wagmiAddress, isConnected: wagmiWalletIsConnected } = useAccount();

  // Helper function to check if two addresses are the same
  const isSameAddress = (addr1?: string, addr2?: string): boolean => {
    if (!addr1 || !addr2) return false;
    return addr1.toLowerCase() === addr2.toLowerCase();
  };

  // Check if connectedEOAWallet and wagmi wallet represent the same wallet
  const connectedEOAAddress = connectedEOAWallet?.getAccount()?.address;
  const isWalletDuplicated = isSameAddress(connectedEOAAddress, wagmiAddress);

  // Determine which wallet to show (prefer connectedEOAWallet if both exist and are the same)
  const shouldShowConnectedEOA = !!connectedEOAWallet;
  // this is disabled because we don't want to display In-App Wallet as a payment method
  const shouldShowWagmiWallet = false; // wagmiWalletIsConnected && (!isWalletDuplicated || !connectedEOAWallet);

  // Determine which address to use based on payment method
  let walletAddress: string | undefined;

  if (selectedCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET) {
    walletAddress = connectedSmartWallet?.getAccount()?.address;
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
  } else if (connectedSmartWallet?.getAccount()?.address) {
    // If only global wallet is available, suggest that
    suggestedPaymentMethod = CryptoPaymentMethodType.GLOBAL_WALLET;
  }

  return {
    walletAddress,
    shouldShowConnectedEOA,
    shouldShowWagmiWallet,
    isWalletDuplicated,
    suggestedPaymentMethod,
  };
}
