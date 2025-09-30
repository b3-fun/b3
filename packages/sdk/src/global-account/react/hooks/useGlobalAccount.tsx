import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect, useState } from "react";
import { useConnectedWallets, useWalletInfo } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";

const debug = debugB3React("useGlobalAccount");

export function useGlobalAccount() {
  const wallets = useConnectedWallets();
  const isConnected = useAuthStore(state => state.isConnected);
  const [globalAccount, setGlobalAccount] = useState<Wallet | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const walletInfo = useWalletInfo(globalAccount?.id);

  useEffect(() => {
    const autoSelectGlobalAccount = async () => {
      // Only proceed if auto-selection is enabled and user is authenticated
      if (!isConnected) {
        debug("Not connected");
        return;
      }

      // Find the first ecosystem wallet (global account)
      const isEcosystemWallet = (wallet: Wallet) => wallet.id.startsWith("ecosystem.");
      const globalAccountWallet = wallets.find(isEcosystemWallet);

      const account = globalAccountWallet?.getAccount();
      setGlobalAccount(globalAccountWallet);
      setAddress(account?.address);
    };

    autoSelectGlobalAccount();
  }, [isConnected, wallets]);

  return {
    account: globalAccount,
    address,
    info: walletInfo,
  };
}
