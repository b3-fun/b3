import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { useEffect, useState } from "react";
import { getLastAuthProvider, useConnectedWallets } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";

export default function useFirstEOA() {
  const wallets = useConnectedWallets();
  const isConnected = useAuthStore(state => state.isConnected);
  const [firstEOA, setFirstEOA] = useState<Wallet | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    const autoSelectFirstEOAWallet = async () => {
      // Only proceed if auto-selection is enabled and user is authenticated
      if (!isConnected) {
        return;
      }

      // Find the first EOA wallet (excluding ecosystem wallets)
      const isEOAWallet = (wallet: Wallet) => !wallet.id.startsWith("ecosystem.");
      const firstEOAWallet = wallets.find(isEOAWallet);

      // Only auto-select if the last auth was via wallet or no previous auth provider
      const lastAuthProvider = await getLastAuthProvider();
      const shouldAutoSelect = lastAuthProvider === null || lastAuthProvider === "wallet";

      if (shouldAutoSelect) {
        const address = await firstEOAWallet?.getAccount();
        setFirstEOA(firstEOAWallet);
        setAddress(address?.address);
      }
    };

    autoSelectFirstEOAWallet();
  }, [isConnected, wallets]);

  return {
    account: firstEOA,
    address,
  };
}
