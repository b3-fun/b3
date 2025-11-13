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
  const [globalAccountWallet, setGlobalAccountWallet] = useState<Wallet | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const walletInfo = useWalletInfo(globalAccount?.id);

  useEffect(() => {
    if (!isConnected) {
      debug("Not connected");
      setGlobalAccount(undefined);
      setAddress(undefined);
      return;
    }

    const globalAccountWallet = wallets.find(wallet => wallet.id.startsWith("ecosystem."));
    setGlobalAccountWallet(globalAccountWallet);
    const account = globalAccountWallet?.getAccount();
    setGlobalAccount(globalAccountWallet);
    setAddress(account?.address);
  }, [isConnected, wallets]);

  return {
    account: globalAccount,
    address,
    info: walletInfo,
    wallet: globalAccountWallet,
  };
}
