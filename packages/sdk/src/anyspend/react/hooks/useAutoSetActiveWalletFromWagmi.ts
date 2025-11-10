import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useCallback, useEffect, useRef } from "react";
import { useSetActiveWallet } from "thirdweb/react";
import { WalletId, createWallet } from "thirdweb/wallets";
import { useAccount } from "wagmi";

/**
 * Hook that automatically sets the active thirdweb wallet when a wagmi wallet connects.
 *
 * This is useful for syncing wagmi wallet connections with thirdweb's wallet system,
 * ensuring that when users connect via wagmi, the active wallet is properly set.
 *
 * Place this hook in components that stay mounted throughout the user flow
 * (not in components that unmount during navigation).
 */
export function useAutoSetActiveWalletFromWagmi() {
  const { address: wagmiAddress, connector: wagmiConnector } = useAccount();
  const setActiveWallet = useSetActiveWallet();
  const prevWagmiAddress = useRef<string | undefined>(undefined);

  // Map wagmi connector names to thirdweb wallet IDs
  const getThirdwebWalletId = useCallback((connectorName: string): WalletId | null => {
    const walletMap: Record<string, WalletId> = {
      MetaMask: "io.metamask",
      "Coinbase Wallet": "com.coinbase.wallet",
      Rainbow: "me.rainbow",
      WalletConnect: "walletConnect",
      Phantom: "app.phantom",
    };
    return walletMap[connectorName] || null;
  }, []);

  // Create thirdweb wallet from wagmi connector
  const createThirdwebWalletFromConnector = useCallback(
    async (connectorName: string) => {
      const walletId = getThirdwebWalletId(connectorName);
      if (!walletId) {
        console.warn(`No thirdweb wallet ID found for connector: ${connectorName}`);
        return null;
      }

      try {
        const thirdwebWallet = createWallet(walletId);
        await thirdwebWallet.connect({ client });
        return thirdwebWallet;
      } catch (error) {
        console.error(`Failed to create thirdweb wallet for ${connectorName}:`, error);
        return null;
      }
    },
    [getThirdwebWalletId],
  );

  // Listen for wagmi wallet connections and automatically set active wallet
  useEffect(() => {
    const isNewConnection = wagmiAddress && wagmiAddress !== prevWagmiAddress.current;

    if (isNewConnection && wagmiConnector?.name) {
      prevWagmiAddress.current = wagmiAddress;

      const setupThirdwebWallet = async () => {
        try {
          const thirdwebWallet = await createThirdwebWalletFromConnector(wagmiConnector.name);
          if (thirdwebWallet) {
            setActiveWallet(thirdwebWallet);
            console.log(`Auto-set active wallet for ${wagmiConnector.name}`);
          }
        } catch (error) {
          console.error("Failed to auto-set active wallet:", error);
        }
      };

      setupThirdwebWallet();
    }

    if (!wagmiAddress) {
      prevWagmiAddress.current = undefined;
    }
  }, [wagmiAddress, wagmiConnector?.name, setActiveWallet, createThirdwebWalletFromConnector]);
}
