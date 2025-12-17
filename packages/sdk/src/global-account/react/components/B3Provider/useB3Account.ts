import { useActiveAccount } from "thirdweb/react";
import { useAuthStore } from "../../stores/useAuthStore";

// Wrapper around useActiveAccount
export const useB3Account = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const activeAccount = useActiveAccount();
  const effectiveAccount = isAuthenticated ? activeAccount : undefined;

  return effectiveAccount;
};
