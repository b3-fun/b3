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
import { BankIcon } from "@b3dotfun/sdk/global-account/react/components/icons/BankIcon";
import { SignOutIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SignOutIcon";
import { SwapIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SwapIcon";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { Loader2, Pencil, Triangle } from "lucide-react";
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
  const { data: eoaNativeBalance } = useNativeBalance(eoaAddress);
  const { data: eoaB3Balance } = useB3BalanceFromAddresses(eoaAddress);
  const { data: signers, refetch: refetchSigners } = useGetAllTWSigners({
    chain,
    accountAddress: account?.address,
  });
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();
  const { logout } = useAuthentication(partnerId);
  const [logoutLoading, setLogoutLoading] = useState(false);

  console.log("account", account);
  console.log("eoaAddress", eoaAddress);

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

  const BalanceContent = () => {
    const { info: eoaInfo } = useFirstEOA();

    return (
      <div className="flex flex-col gap-6">
        {/* Profile Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile?.avatar ? (
                <img src={profile?.avatar} alt="Profile" className="size-24 rounded-full" />
              ) : (
                <div className="bg-b3-primary-wash size-24 rounded-full" />
              )}
              <div className="bg-b3-grey absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-4 border-white">
                <Pencil size={16} className="text-b3-white" />
              </div>
            </div>
            <div>
              <h2 className="text-b3-grey text-xl font-semibold">
                {profile?.displayName || formatUsername(profile?.name || "")}
              </h2>
              <span className="text-b3-foreground-muted">{formatUsername(profile?.name || "")}</span>
            </div>
          </div>
        </div>
        <div className="bg-b3-line flex h-11 items-center gap-2 rounded-full px-4">
          <span className="text-b3-grey font-neue-montreal-semibold">{centerTruncate(account?.address || "")}</span>
          <CopyToClipboard text={account?.address || ""} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="bg-b3-primary-wash hover:bg-b3-primary-wash/70 h-[84px] w-full flex-col items-start gap-2 rounded-2xl"
            onClick={() => {
              setB3ModalOpen(true);
              setB3ModalContentType({
                type: "anySpend",
                defaultActiveTab: "fiat",
                showBackButton: true,
              });
            }}
          >
            <BankIcon size={24} className="text-b3-primary-blue shrink-0" />
            <div className="text-b3-grey font-neue-montreal-semibold">Deposit</div>
          </Button>
          <Button
            className="bg-b3-primary-wash hover:bg-b3-primary-wash/70 flex h-[84px] w-full flex-col items-start gap-2 rounded-2xl"
            onClick={() => {
              setB3ModalOpen(true);
              setB3ModalContentType({
                type: "anySpend",
                showBackButton: true,
              });
            }}
          >
            <SwapIcon size={24} className="text-b3-primary-blue" />
            <div className="text-b3-grey font-neue-montreal-semibold">Swap</div>
          </Button>
        </div>

        {/* Balance Section */}
        <div className="space-y-4">
          <h3 className="text-b3-grey font-neue-montreal-semibold">Balance</h3>

          {/* B3 Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full">
                <img src="https://cdn.b3.fun/b3-coin-3d.png" alt="B3" className="size-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-b3-grey font-neue-montreal-semibold">B3</span>
                </div>
                <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                  {b3Balance?.formattedTotal || "0.00"} B3
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-b3-grey font-neue-montreal-semibold">
                ${b3Balance?.balanceUsdFormatted || "0.00"}
              </div>
              <div className="flex items-center gap-1">
                {b3Balance?.priceChange24h !== null && b3Balance?.priceChange24h !== undefined ? (
                  <>
                    <Triangle
                      className={`size-3 ${b3Balance.priceChange24h >= 0 ? "text-b3-positive fill-b3-positive" : "text-b3-negative fill-b3-negative rotate-180"}`}
                    />
                    <span
                      className={`font-neue-montreal-medium text-sm ${b3Balance.priceChange24h >= 0 ? "text-b3-positive" : "text-b3-negative"}`}
                    >
                      {b3Balance.priceChange24h >= 0 ? "+" : ""}
                      {b3Balance.priceChange24h.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span className="text-b3-foreground-muted font-neue-montreal-medium text-sm">--</span>
                )}
              </div>
            </div>
          </div>

          {/* ETH Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full">
                <img src="https://cdn.b3.fun/ethereum.svg" alt="ETH" className="size-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-b3-grey font-neue-montreal-semibold">Ethereum</span>
                </div>
                <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                  {nativeBalance?.formattedTotal || "0.00"} ETH
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-b3-grey font-neue-montreal-semibold">
                ${nativeBalance?.formattedTotalUsd || "0.00"}
              </div>
              <div className="flex items-center gap-2">
                {nativeBalance?.priceChange24h !== null && nativeBalance?.priceChange24h !== undefined ? (
                  <>
                    <Triangle
                      className={`size-3 ${nativeBalance.priceChange24h >= 0 ? "text-b3-positive fill-b3-positive" : "text-b3-negative fill-b3-negative rotate-180"}`}
                    />
                    <span
                      className={`font-neue-montreal-medium text-sm ${nativeBalance.priceChange24h >= 0 ? "text-b3-positive" : "text-b3-negative"}`}
                    >
                      {nativeBalance.priceChange24h >= 0 ? "+" : ""}
                      {nativeBalance.priceChange24h.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span className="text-b3-foreground-muted font-neue-montreal-medium text-sm">--</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EOA Account Balance Section - matching global balance styling */}
        {eoaAddress && (
          <div className="space-y-4">
            <h3 className="text-b3-grey font-neue-montreal-semibold">Connected {eoaInfo?.data?.name || "Wallet"}</h3>

            {/* EOA Address */}
            <div className="bg-b3-line flex h-11 items-center gap-2 rounded-full px-4">
              <span className="text-b3-grey font-neue-montreal-semibold">{centerTruncate(eoaAddress)}</span>
              <CopyToClipboard text={eoaAddress} />
            </div>

            {/* EOA B3 Balance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full">
                  <img src="https://cdn.b3.fun/b3-coin-3d.png" alt="B3" className="size-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-b3-grey font-neue-montreal-semibold">B3</span>
                  </div>
                  <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                    {eoaB3Balance?.formattedTotal || "0.00"} B3
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-b3-grey font-neue-montreal-semibold">
                  ${eoaB3Balance?.balanceUsdFormatted || "0.00"}
                </div>
                <div className="flex items-center gap-1">
                  {eoaB3Balance?.priceChange24h !== null && eoaB3Balance?.priceChange24h !== undefined ? (
                    <>
                      <Triangle
                        className={`size-3 ${eoaB3Balance.priceChange24h >= 0 ? "text-b3-positive fill-b3-positive" : "text-b3-negative fill-b3-negative rotate-180"}`}
                      />
                      <span
                        className={`font-neue-montreal-medium text-sm ${eoaB3Balance.priceChange24h >= 0 ? "text-b3-positive" : "text-b3-negative"}`}
                      >
                        {eoaB3Balance.priceChange24h >= 0 ? "+" : ""}
                        {eoaB3Balance.priceChange24h.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-b3-foreground-muted font-neue-montreal-medium text-sm">--</span>
                  )}
                </div>
              </div>
            </div>

            {/* EOA ETH Balance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full">
                  <img src="https://cdn.b3.fun/ethereum.svg" alt="ETH" className="size-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-b3-grey font-neue-montreal-semibold">Ethereum</span>
                  </div>
                  <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                    {eoaNativeBalance?.formattedTotal || "0.00"} ETH
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-b3-grey font-neue-montreal-semibold">
                  ${eoaNativeBalance?.formattedTotalUsd || "0.00"}
                </div>
                <div className="flex items-center gap-2">
                  {eoaNativeBalance?.priceChange24h !== null && eoaNativeBalance?.priceChange24h !== undefined ? (
                    <>
                      <Triangle
                        className={`size-3 ${eoaNativeBalance.priceChange24h >= 0 ? "text-b3-positive fill-b3-positive" : "text-b3-negative fill-b3-negative rotate-180"}`}
                      />
                      <span
                        className={`font-neue-montreal-medium text-sm ${eoaNativeBalance.priceChange24h >= 0 ? "text-b3-positive" : "text-b3-negative"}`}
                      >
                        {eoaNativeBalance.priceChange24h >= 0 ? "+" : ""}
                        {eoaNativeBalance.priceChange24h.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-b3-foreground-muted font-neue-montreal-medium text-sm">--</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Account Info */}
        <div className="border-b3-line flex items-center justify-between rounded-2xl border p-4">
          <div className="">
            <div className="flex items-center gap-2">
              <img src="https://cdn.b3.fun/b3_logo.svg" alt="B3" className="h-4" />
              <h3 className="font-neue-montreal-semibold text-b3-grey">Global Account</h3>
            </div>

            <p className="text-b3-foreground-muted font-neue-montreal-medium mt-2 text-sm">
              Your universal account for all B3-powered apps
            </p>
          </div>
          <button
            className="text-b3-grey hover:text-b3-grey/80 hover:bg-b3-line border-b3-line flex size-12 items-center justify-center rounded-full border"
            onClick={onLogoutEnhanced}
          >
            {logoutLoading ? <Loader2 className="animate-spin" /> : <SignOutIcon size={16} className="text-b3-grey" />}
          </button>
        </div>
      </div>
    );
  };

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
          <TabsListPrimitive className="font-neue-montreal-semibold text-b3-grey flex h-8 w-full items-start justify-start gap-8 border-0 text-xl md:p-4">
            <TabTriggerPrimitive
              value="balance"
              className="data-[state=active]:text-b3-primary-blue data-[state=active]:border-b-b3-primary-blue flex-none rounded-none border-0 p-0 pb-1 text-xl leading-none tracking-wide transition-colors data-[state=active]:border-b data-[state=active]:bg-white md:pb-4"
            >
              Overview
            </TabTriggerPrimitive>
            <TabTriggerPrimitive
              value="assets"
              className="data-[state=active]:text-b3-primary-blue data-[state=active]:border-b-b3-primary-blue flex-none rounded-none border-0 p-0 pb-1 text-xl leading-none tracking-wide transition-colors data-[state=active]:border-b data-[state=active]:bg-white md:pb-4"
            >
              Mints
            </TabTriggerPrimitive>
            <TabTriggerPrimitive
              value="apps"
              className="data-[state=active]:text-b3-primary-blue data-[state=active]:border-b-b3-primary-blue flex-none rounded-none border-0 p-0 pb-1 text-xl leading-none tracking-wide transition-colors data-[state=active]:border-b data-[state=active]:bg-white md:pb-4"
            >
              Apps
            </TabTriggerPrimitive>
          </TabsListPrimitive>

          <TabsContentPrimitive value="balance" className="pt-4 md:p-4">
            <BalanceContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="assets" className="pt-4 md:p-4">
            <AssetsContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="apps" className="pt-4 md:p-4">
            <AppsContent />
          </TabsContentPrimitive>
        </TabsPrimitive>
      </div>
    </div>
  );
}
