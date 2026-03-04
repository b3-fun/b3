import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback, useEffect, useRef } from "react";
import { getLastAuthProvider, useAddConnectedWallet, useConnectedWallets, useSetActiveWallet } from "thirdweb/react";
import { EIP1193, Wallet } from "thirdweb/wallets";
import { useAuthStore } from "../stores";

const debug = debugB3React("useAutoSelectWallet");

/**
 * Hook to automatically connect a default EOA provider (if given) and
 * select the first EOA wallet when user is authenticated.
 * Only auto-selects if the last auth was via wallet or no previous auth provider.
 */
export function useAutoSelectWallet({
  enabled,
  defaultEoaProvider,
}: {
  enabled: boolean;
  defaultEoaProvider?: EIP1193.EIP1193Provider;
}) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const wallets = useConnectedWallets();
  const setActiveWallet = useSetActiveWallet();
  const addConnectedWallet = useAddConnectedWallet();
  const hasConnectedProvider = useRef(false);

  // Auto-connect the default EOA provider (e.g. Farcaster frame wallet) on mount.
  // Uses useAddConnectedWallet instead of useConnect so the wallet is added to
  // connectedWallets WITHOUT becoming the active wallet. This prevents
  // useAuthentication's logout/onTimeout from disconnecting it (logout only
  // disconnects ecosystem wallets and the active wallet).
  useEffect(() => {
    if (!defaultEoaProvider || hasConnectedProvider.current) return;
    hasConnectedProvider.current = true;

    const connectDefaultProvider = async () => {
      try {
        const wallet = EIP1193.fromProvider({ provider: defaultEoaProvider });
        await wallet.connect({ client });
        addConnectedWallet(wallet);
        debug("Auto-connected default EOA provider", wallet.id);
      } catch (error) {
        debug("Failed to auto-connect default EOA provider", error);
        hasConnectedProvider.current = false;
      }
    };

    connectDefaultProvider();
  }, [defaultEoaProvider, addConnectedWallet]);

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
