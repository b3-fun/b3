import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback, useEffect } from "react";
import { getLastAuthProvider, useConnectedWallets, useSetActiveWallet } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";
import { useAuthStore } from "../stores";

const debug = debugB3React("useAutoSelectWallet");

/**
 * Hook to automatically select the first EOA wallet when user is authenticated
 * Only auto-selects if the last auth was via wallet or no previous auth provider
 */
export function useAutoSelectWallet({ enabled }: { enabled: boolean }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const wallets = useConnectedWallets();
  const setActiveWallet = useSetActiveWallet();

  const setWallet = useCallback(
    (wallet: Wallet) => {
      debug("@@setWallet", wallet.id, wallet.getAccount()?.address);
      setActiveWallet(wallet);
    },
    [setActiveWallet],
  );

  useEffect(() => {
    const autoSelectFirstEOAWallet = async () => {
      // Only proceed if auto-selection is enabled and user is authenticated
      if (!enabled || !isAuthenticated) {
        return;
      }

      // Find the first EOA wallet (excluding ecosystem wallets)
      const isEOAWallet = (wallet: Wallet) => !wallet.id.startsWith("ecosystem.");
      const firstEOAWallet = wallets.find(isEOAWallet);

      if (firstEOAWallet) {
        // Only auto-select if the last auth was via wallet or no previous auth provider
        const lastAuthProvider = await getLastAuthProvider();
        const shouldAutoSelect = lastAuthProvider === null || lastAuthProvider === "wallet";

        if (shouldAutoSelect) {
          debug("Auto-selecting first EOA wallet", firstEOAWallet.id);
          setWallet(firstEOAWallet);
        }
      }
    };

    autoSelectFirstEOAWallet();
  }, [enabled, isAuthenticated, setWallet, wallets]);
}
