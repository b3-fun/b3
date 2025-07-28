"use client";

import { SignInWithB3, useAccountWallet, useModalStore, useProfile } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { b3 } from "viem/chains";

export function SignInButton() {
  const { address, wallet } = useAccountWallet();
  const profile = useProfile({ address });
  const ensName = profile.data?.name?.replace(/\.b3\.fun/g, "");
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const b3Config = {
    chain: {
      ...b3,
      rpc: "https://mainnet-rpc.b3.fun",
      blockExplorers: [{ name: "B3 Explorer", url: "https://explorer.b3.fun/" }],
      testnet: undefined,
    },
    partnerId: String(process.env.NEXT_PUBLIC_THIRDWEB_PARTNER_ID),
    closeAfterLogin: true,
    loginWithSiwe: true,
    withLogo: true,
  };

  const handleManageAccount = () => {
    setB3ModalContentType({
      ...b3Config,
      type: "manageAccount",
    });
    setB3ModalOpen(true);
  };

  return (
    <div className="fixed right-4 top-4 z-[100]">
      <div className="relative flex items-center gap-2">
        {address ? (
          <button
            onClick={handleManageAccount}
            type="button"
            className={cn(
              "relative flex items-center gap-2 rounded-full bg-black/80 px-4 py-2",
              "text-sm font-medium text-white hover:bg-black/60",
              "ring-1 ring-white/20 backdrop-blur",
            )}
          >
            <div className="relative flex items-center gap-2">
              {wallet?.meta?.icon ? (
                <img src={wallet.meta.icon} alt="Profile" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                  <span className="text-xs font-medium text-white">{address.slice(2, 4).toUpperCase()}</span>
                </div>
              )}
              <span className="relative z-10 min-w-[80px] text-white">{ensName || shortenAddress(address)}</span>
            </div>
          </button>
        ) : (
          <SignInWithB3 {...b3Config} />
        )}
      </div>
    </div>
  );
}
