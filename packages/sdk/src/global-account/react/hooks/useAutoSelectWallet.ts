import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect } from "react";
import { getLastAuthProvider, useConnectedWallets } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";

const debug = debugB3React("useAutoSelectWallet");

/**
 * Hook to automatically select the first EOA wallet when user is authenticated
 * Only auto-selects if the last auth was via wallet or no previous auth provider
 */
export function useAutoSelectWallet({
  enabled,
  isAuthenticated,
  onSelectWallet,
}: {
  enabled: boolean;
  isAuthenticated: boolean;
  onSelectWallet: (wallet: Wallet) => void;
}) {
  const wallets = useConnectedWallets();

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
          onSelectWallet(firstEOAWallet);
        }
      }
    };

    autoSelectFirstEOAWallet();
  }, [enabled, isAuthenticated, onSelectWallet, wallets]);
}

