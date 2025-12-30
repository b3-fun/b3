import { useActiveAccount } from "thirdweb/react";

// Wrapper around useActiveAccount
export const useB3Account = () => {
  const account = useActiveAccount();
  return account;
};
