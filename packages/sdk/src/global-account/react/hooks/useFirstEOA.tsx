import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect, useState } from "react";
import { useConnectedWallets, useWalletInfo } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";

const debug = debugB3React("useFirstEOA");

export default function useFirstEOA() {
  const wallets = useConnectedWallets();
  const isConnected = useAuthStore(state => state.isConnected);
  const [firstEOA, setFirstEOA] = useState<Wallet | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const walletInfo = useWalletInfo(firstEOA?.id);

  debug("Wallets", wallets);
  debug("Is connected", isConnected);

  useEffect(() => {
    const autoSelectFirstEOAWallet = async () => {
      // Only proceed if auto-selection is enabled and user is authenticated
      if (!isConnected) {
        debug("Not connected");
        return;
      }

      // Find the first EOA wallet (excluding ecosystem wallets)
      const isEOAWallet = (wallet: Wallet) => !wallet.id.startsWith("ecosystem.");
      const firstEOAWallet = wallets.find(isEOAWallet);
      debug("First EOA wallet", firstEOAWallet);

      const account = firstEOAWallet?.getAccount();
      debug("Account", account);
      setFirstEOA(firstEOAWallet);
      debug("Address", account?.address);
      setAddress(account?.address);
    };

    autoSelectFirstEOAWallet();
  }, [isConnected, wallets]);

  return {
    account: firstEOA,
    address,
    info: walletInfo,
  };
}

export { useFirstEOA };
