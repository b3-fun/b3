import { useProfile } from "@b3dotfun/sdk/global-account/react";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect, useMemo, useState } from "react";
import { getLastAuthProvider, useActiveWallet, useConnectedWallets, useWalletImage } from "thirdweb/react";
import { Account, Wallet } from "thirdweb/wallets";
import { socialIcons } from "thirdweb/wallets/in-app";
import { useB3Account } from "../components/B3Provider/useB3Account";
import { useB3Config } from "../components/B3Provider/useB3Config";

const debug = debugB3React("useAccountWallet");

function useLastAuthProvider(): string | null {
  const [lastAuthProvider, setLastAuthProvider] = useState<string | null>(null);

  useEffect(() => {
    const fn = async () => {
      const provider = await getLastAuthProvider();
      setLastAuthProvider(provider);
    };
    fn();
  }, []);

  return lastAuthProvider;
}

export function useAccountWallet(): {
  wallet: {
    address?: string;
    ensName?: string;
    meta?: {
      icon: string;
    };
  } & Partial<Account>;

  address?: string;
  ensName?: string;

  connectedSmartWallet?: Wallet;
  connectedEOAWallet?: Wallet;

  isActiveSmartWallet?: boolean;
  isActiveEOAWallet?: boolean;

  eoaWalletIcon?: string;
  smartWalletIcon?: string;
} {
  // WOJ: --------------------
  //  values from in useB3:
  //  const activeAccount = useActiveAccount();
  // const effectiveAccount = isAuthenticated ? accountOverride || activeAccount : undefined;
  // can we possibly just use useActiveAccount here?
  // --------------------
  const account = useB3Account();

  const activeWallet = useActiveWallet();
  const connectedWallets = useConnectedWallets();

  const connectedSmartWallet = connectedWallets.find(wallet => wallet.id === ecosystemWalletId);
  const connectedEOAWallet = connectedWallets.find(wallet => wallet.id !== ecosystemWalletId);
  const isActiveSmartWallet = activeWallet?.id === connectedSmartWallet?.id;
  const isActiveEOAWallet = activeWallet?.id === connectedEOAWallet?.id;

  debug("activeWallet", activeWallet);
  debug("connectedWallets", connectedWallets);
  debug("connectedSmartWallet", connectedSmartWallet);
  debug("connectedEOAWallet", connectedEOAWallet);
  debug("isActiveSmartWallet", isActiveSmartWallet);
  debug("isActiveEOAWallet", isActiveEOAWallet);

  // If not EOA sign in, then we need to show the smart wallet icon
  const lastAuthProvider = useLastAuthProvider();

  const smartWalletIcon =
    lastAuthProvider && !connectedEOAWallet
      ? socialIcons[lastAuthProvider as keyof typeof socialIcons]
      : "https://gradvatar.com/0x0000000000000000000000000000000000000000"; // show smart wallet of eoa wallet is gradvatar

  const { data: profileData } = useProfile({ address: account?.address });
  const ensName = profileData?.displayName?.replace(/\.b3\.fun/g, "");

  const res = useMemo(
    () => ({
      wallet: {
        ...account,
        ensName,
        meta: {
          icon: "", // deprecated
        },
      },

      address: account?.address,
      ensName,

      connectedSmartWallet: connectedSmartWallet,
      connectedEOAWallet: connectedEOAWallet,

      isActiveSmartWallet: isActiveSmartWallet,
      isActiveEOAWallet: isActiveEOAWallet,

      smartWalletIcon: smartWalletIcon,
      eoaWalletIcon: "", // deprecated
    }),
    [
      account,
      connectedEOAWallet,
      connectedSmartWallet,
      ensName,
      isActiveEOAWallet,
      isActiveSmartWallet,
      smartWalletIcon,
    ],
  );

  return res;
}

export function useAccountWalletImage(): string {
  const { partnerId } = useB3Config();
  const account = useB3Account();

  const activeWallet = useActiveWallet();
  const connectedWallets = useConnectedWallets();

  const connectedSmartWallet = connectedWallets.find(wallet => wallet.id === ecosystemWalletId);
  const connectedEOAWallet = connectedWallets.find(wallet => wallet.id !== ecosystemWalletId);
  const isActiveSmartWallet = activeWallet?.id === connectedSmartWallet?.id;

  const { data: walletImage } = useWalletImage(connectedEOAWallet?.id);

  // If not EOA sign in, then we need to show the smart wallet icon
  const lastAuthProvider = useLastAuthProvider();

  const smartWalletIcon =
    lastAuthProvider && !connectedEOAWallet
      ? socialIcons[lastAuthProvider as keyof typeof socialIcons]
      : "https://gradvatar.com/0x0000000000000000000000000000000000000000"; // show smart wallet of eoa wallet is gradvatar

  const { data: profileData } = useProfile({ address: account?.address });

  const avatarUrl = profileData?.avatar;

  return avatarUrl || (isActiveSmartWallet ? smartWalletIcon : walletImage) || "";
}
