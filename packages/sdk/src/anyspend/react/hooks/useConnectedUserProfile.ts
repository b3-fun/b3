import { useProfile } from "@b3dotfun/sdk/global-account/react";
import { CryptoPaymentMethodType } from "../components/common/CryptoPaymentMethod";
import { useConnectedWalletDisplay } from "./useConnectedWalletDisplay";

/**
 * Hook that provides connected user's address, profile, and cleaned display name
 * Combines logic for getting connected address from either global account or thirdweb wallets
 */
export function useConnectedUserProfile(selectedCryptoPaymentMethod?: CryptoPaymentMethodType) {
  const { walletAddress } = useConnectedWalletDisplay(selectedCryptoPaymentMethod);

  // Fetch profile data for the connected address with cleaned name
  const connectedProfile = useProfile({ address: walletAddress });

  return {
    address: walletAddress,
    profile: connectedProfile,
    name: connectedProfile.data?.name,
    isLoading: connectedProfile.isLoading,
    isError: connectedProfile.isError,
    error: connectedProfile.error,
  };
}
