import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { useUserStore } from "../stores/userStore";

/**
 * Preferred Hook to get the user data
 */
export function useUser() {
  const user = useUserStore(state => state.user);

  const isConnecting = useAuthStore(state => state.isConnecting);
  const isConnected = useAuthStore(state => state.isConnected);
  const isAuthenticating = useAuthStore(state => state.isAuthenticating);

  return {
    user,
    isConnecting,
    isConnected,
    isAuthenticating,
  };
}
