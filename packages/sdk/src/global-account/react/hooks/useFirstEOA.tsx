import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { useEffect, useState } from "react";
import { useConnectedWallets, useWalletInfo } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";

export default function useFirstEOA() {
  const wallets = useConnectedWallets();
  const isConnected = useAuthStore(state => state.isConnected);
  const [firstEOA, setFirstEOA] = useState<Wallet | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const walletInfo = useWalletInfo(firstEOA?.id);

  console.log("@@wallets", wallets);
  console.log("@@wallets:isConnected", isConnected);

  useEffect(() => {
    const autoSelectFirstEOAWallet = async () => {
      // Only proceed if auto-selection is enabled and user is authenticated
      if (!isConnected) {
        console.log("@@wallets:not connected");
        return;
      }

      // Find the first EOA wallet (excluding ecosystem wallets)
      const isEOAWallet = (wallet: Wallet) => !wallet.id.startsWith("ecosystem.");
      const firstEOAWallet = wallets.find(isEOAWallet);
      console.log("@@wallets:firstEOAWallet", firstEOAWallet);

      const account = await firstEOAWallet?.getAccount();
      console.log("@@wallets:account", account);
      setFirstEOA(firstEOAWallet);
      console.log("@@wallets:address", account?.address);
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
