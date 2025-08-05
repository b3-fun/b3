import {
  Button,
  CopyToClipboard,
  TabsContentPrimitive,
  TabsListPrimitive,
  TabsPrimitive,
  TabTriggerPrimitive,
  TWSignerWithMetadata,
  useAccountAssets,
  useAuthentication,
  useB3BalanceFromAddresses,
  useGetAllTWSigners,
  useModalStore,
  useNativeBalance,
  useProfile,
  useRemoveSessionKey,
} from "@b3dotfun/sdk/global-account/react";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { useState } from "react";
import { Chain } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { formatUnits } from "viem";
import useFirstEOA from "../../hooks/useFirstEOA";
import { AccountAssets } from "../AccountAssets/AccountAssets";

interface ManageAccountProps {
  onLogout?: () => void;
  onSwap?: () => void;
  onDeposit?: () => void;
  onViewProfile?: () => void;
  chain: Chain;
  partnerId: string;
}

function centerTruncate(str: string, length = 4) {
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

export function ManageAccount({
  onLogout,
  onSwap: _onSwap,
  onDeposit: _onDeposit,
  chain,
  partnerId,
}: ManageAccountProps) {
  const [activeTab, setActiveTab] = useState("balance");
  const [revokingSignerId, setRevokingSignerId] = useState<string | null>(null);
  const account = useActiveAccount();
  const { data: assets, isLoading } = useAccountAssets(account?.address);
  const { data: b3Balance } = useB3BalanceFromAddresses(account?.address);
  const { data: nativeBalance } = useNativeBalance(account?.address);
  const { address: eoaAddress } = useFirstEOA();
  const { data: profile } = useProfile({
    address: eoaAddress || account?.address,
    fresh: true,
  });
  const { data: signers, refetch: refetchSigners } = useGetAllTWSigners({
    chain,
    accountAddress: account?.address,
  });
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();
  const { logout } = useAuthentication(partnerId);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const { removeSessionKey } = useRemoveSessionKey({
    chain,
    onSuccess: tx => {
      console.log("@@removeSessionKey:tx", tx);
      setRevokingSignerId(null);
    },
    onError: error => {
      console.error("Error revoking access:", error);
      setRevokingSignerId(null);
    },
    refetchSigners: () => refetchSigners(),
  });

  const handleRevoke = async (signer: TWSignerWithMetadata) => {
    setRevokingSignerId(signer.id);
    await removeSessionKey(signer);
  };

  const onLogoutEnhanced = async () => {
    setLogoutLoading(true);
    await logout();
    onLogout?.();
    setB3ModalOpen(false);
    setLogoutLoading(false);
  };

  const BalanceContent = () => (
    <div className="flex flex-col gap-6">
      {/* Profile Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${account?.address}`}
            alt="Profile"
            className="h-12 w-12 rounded-full bg-black"
          />
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {profile?.displayName || profile?.name || "Unnamed User"}
            </h2>
            <span className="text-sm text-gray-500">{profile?.name ? `@${profile.name}` : ""}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-800">
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {centerTruncate(eoaAddress || account?.address || "", 4)}
          </span>
          <CopyToClipboard text={eoaAddress || account?.address || ""} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
          onClick={() => {
            setB3ModalOpen(true);
            setB3ModalContentType({
              type: "anySpend",
              defaultActiveTab: "fiat",
              showBackButton: true,
            });
          }}
        >
          <span className="mr-2">💰</span>
          Deposit
        </Button>
        <Button
          variant="outline"
          className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
          onClick={() => {
            setB3ModalOpen(true);
            setB3ModalContentType({
              type: "anySpend",
              showBackButton: true,
            });
          }}
        >
          <span className="mr-2">🔄</span>
          Swap
        </Button>
      </div>

      {/* Balance Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Balance</h3>

        {/* B3 Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://cdn.b3.fun/b3-coin-3d.png" alt="B3" className="h-8 w-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">B3</span>
                <span className="text-sm text-gray-500">{b3Balance?.formattedTotal || "0.00"} B3</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-900 dark:text-white">${b3Balance?.balanceUsdFormatted}</span>
                {/* TODO: Add price change */}
                {/* <span className="ml-2 text-green-500">+0.27%</span> */}
              </div>
            </div>
          </div>
        </div>

        {/* ETH Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://cdn.b3.fun/ethereum.svg" alt="ETH" className="h-8 w-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Ethereum</span>
                <span className="text-sm text-gray-500">{nativeBalance?.formattedTotal || "0.00"} ETH</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-900 dark:text-white">${nativeBalance?.formattedTotalUsd}</span>
                {/* TODO: Add price change */}
                {/* <span className="ml-2 text-red-500">-2.45%</span> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Account Info */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <img src="https://cdn.b3.fun/b3_logo.svg" alt="B3" className="h-6 w-6" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Global Account</h3>
            <p className="text-sm text-gray-500">Your universal account for all B3-powered apps</p>
          </div>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={() => {
            // You can add profile edit functionality here
            alert("Profile settings coming soon");
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 17L17 7M17 7H7M17 7V17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  const AssetsContent = () => (
    <div className="grid grid-cols-3 gap-4">
      {assets?.nftResponse ? (
        <AccountAssets nfts={assets.nftResponse} isLoading={isLoading} />
      ) : (
        <div className="col-span-3 py-12 text-center text-gray-500">No NFTs found</div>
      )}
    </div>
  );

  const AppsContent = () => (
    <div className="space-y-4">
      {signers?.map((signer: TWSignerWithMetadata) => (
        <div key={signer.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">App</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{signer.partner.name}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">Added {new Date(signer.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">
                    Expires {new Date(Number(signer.endTimestamp) * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Max spend: {formatNumber(Number(formatUnits(signer.nativeTokenLimitPerTransaction, 18)))} ETH
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-500 hover:border-red-300 hover:text-red-600"
              onClick={() => handleRevoke(signer)}
              disabled={revokingSignerId === signer.id}
            >
              {revokingSignerId === signer.id ? "Revoking..." : "Revoke"}
            </Button>
          </div>
        </div>
      ))}

      {!signers?.length && <div className="py-12 text-center text-gray-500">No connected apps</div>}
    </div>
  );

  return (
    <div className="flex flex-col rounded-xl bg-white dark:bg-gray-900">
      <div className="flex-1">
        <TabsPrimitive defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsListPrimitive className="flex w-full rounded-t-xl bg-gray-100 p-1 dark:bg-gray-800">
            <TabTriggerPrimitive
              value="balance"
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-400 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white"
            >
              Overview
            </TabTriggerPrimitive>
            <TabTriggerPrimitive
              value="assets"
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-400 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white"
            >
              Mints
            </TabTriggerPrimitive>
            <TabTriggerPrimitive
              value="apps"
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-400 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white"
            >
              Apps
            </TabTriggerPrimitive>
          </TabsListPrimitive>

          <TabsContentPrimitive value="balance" className="p-4">
            <BalanceContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="assets" className="p-4">
            <AssetsContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="apps" className="p-4">
            <AppsContent />
          </TabsContentPrimitive>
        </TabsPrimitive>
      </div>

      <div className="border-t border-gray-200 p-6 dark:border-gray-800">
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-center border-gray-200 text-gray-600 hover:text-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:text-white"
          onClick={onLogoutEnhanced}
        >
          {logoutLoading ? "Logging out..." : "Disconnect from apps"}
        </Button>
      </div>
    </div>
  );
}
