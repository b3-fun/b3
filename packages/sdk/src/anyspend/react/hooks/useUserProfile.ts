import { useProfile } from "@b3dotfun/sdk/global-account/react";

/**
 * Hook that provides user profile data and cleaned display name for any address
 * Useful for getting profile information and cleaning .b3.fun suffixes
 */
export function useUserProfile(address?: string) {
  // Fetch profile data for the provided address
  const profile = useProfile({ address });

  // Clean the display name by removing .b3.fun suffix
  const name = profile.data?.name?.replace(/\.b3\.fun/g, "");

  return {
    profile,
    name,
    isLoading: profile.isLoading,
    isError: profile.isError,
    error: profile.error,
  };
}
