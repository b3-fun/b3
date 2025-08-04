import { useAccountWallet, useProfile } from "@b3dotfun/sdk/global-account/react";
import { useConnectedWallets } from "thirdweb/react";

/**
 * Hook that provides connected user's address, profile, and cleaned display name
 * Combines logic for getting connected address from either global account or thirdweb wallets
 */
export function useConnectedUserProfile() {
  const { address: globalAddress } = useAccountWallet();
  const connectedWallets = useConnectedWallets();

  // Get connected address from global account or first connected wallet
  const connectedAddress = globalAddress || connectedWallets?.[0]?.getAccount()?.address;

  // Fetch profile data for the connected address
  const connectedProfile = useProfile({ address: connectedAddress });

  // Clean the display name by removing .b3.fun suffix
  const connectedName = connectedProfile.data?.name?.replace(/\.b3\.fun/g, "");

  return {
    address: connectedAddress,
    profile: connectedProfile,
    name: connectedName,
    isLoading: connectedProfile.isLoading,
    isError: connectedProfile.isError,
    error: connectedProfile.error,
  };
}
