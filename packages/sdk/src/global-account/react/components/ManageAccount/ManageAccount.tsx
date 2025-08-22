import {
  Button,
  CopyToClipboard,
  ManageAccountModalProps,
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
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import {
  BarChart3,
  Coins,
  Grid3X3,
  Image,
  LinkIcon,
  Loader2,
  Pencil,
  Settings,
  Triangle,
  UnlinkIcon,
} from "lucide-react";
import { useState } from "react";
import { Chain } from "thirdweb";
import { useActiveAccount, useProfiles, useUnlinkProfile } from "thirdweb/react";
import { formatUnits } from "viem";
import useFirstEOA from "../../hooks/useFirstEOA";
import { getProfileDisplayInfo } from "../../utils/profileDisplay";
import { AccountAssets } from "../AccountAssets/AccountAssets";

type TabValue = "balance" | "tokens" | "assets" | "apps" | "settings";

interface ManageAccountProps {
  onLogout?: () => void;
  onSwap?: () => void;
  onDeposit?: () => void;
  onViewProfile?: () => void;
  chain: Chain;
  partnerId: string;
  containerClassName?: string;
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
  const { setB3ModalOpen, setB3ModalContentType, contentType } = useModalStore();
  const { activeTab = "balance", setActiveTab } = contentType as ManageAccountModalProps;
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
              <div className="bg-b3-grey border-b3-background absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-4">
                <Pencil size={16} className="text-b3-background" />
              </div>
            </div>
            <div>
              <h2 className="text-b3-grey text-xl font-semibold">
                {profile?.displayName || formatUsername(profile?.name || "")}
              </h2>
              <div className="border-b3-line bg-b3-line/20 hover:bg-b3-line/40 flex w-fit items-center gap-2 rounded-full border px-3 py-1 transition-colors">
                <span className="text-b3-foreground-muted font-mono text-xs">
                  {centerTruncate(account?.address || "", 6)}
                </span>
                <CopyToClipboard text={account?.address || ""} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="manage-account-deposit bg-b3-primary-wash hover:bg-b3-primary-wash/70 h-[84px] w-full flex-col items-start gap-2 rounded-2xl"
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
            className="manage-account-swap bg-b3-primary-wash hover:bg-b3-primary-wash/70 flex h-[84px] w-full flex-col items-start gap-2 rounded-2xl"
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
            <div className="flex items-center gap-3">
              <h3 className="text-b3-grey font-neue-montreal-semibold">Connected {eoaInfo?.data?.name || "Wallet"}</h3>
              <div className="border-b3-line bg-b3-line/20 hover:bg-b3-line/40 flex w-fit items-center gap-2 rounded-full border px-3 py-1 transition-colors">
                <span className="text-b3-foreground-muted font-mono text-xs">{centerTruncate(eoaAddress, 6)}</span>
                <CopyToClipboard text={eoaAddress} />
              </div>
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
              Your universal account for all B3 apps
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

  const TokensContent = () => (
    <div className="space-y-4">
      <h3 className="text-b3-grey font-neue-montreal-semibold text-xl">My Tokens</h3>
      <div className="space-y-3">
        {/* B3 Token */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full">
              <img src="https://cdn.b3.fun/b3-coin-3d.png" alt="B3" className="size-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-b3-grey font-neue-montreal-semibold">B3</span>
              </div>
              <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">B3 Token</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-b3-grey font-neue-montreal-semibold">{b3Balance?.formattedTotal || "0.00"}</div>
            <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
              ${b3Balance?.balanceUsdFormatted || "0.00"}
            </div>
          </div>
        </div>

        {/* ETH Token */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full">
              <img src="https://cdn.b3.fun/ethereum.svg" alt="ETH" className="size-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-b3-grey font-neue-montreal-semibold">Ethereum</span>
              </div>
              <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">ETH</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-b3-grey font-neue-montreal-semibold">{nativeBalance?.formattedTotal || "0.00"}</div>
            <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
              ${nativeBalance?.formattedTotalUsd || "0.00"}
            </div>
          </div>
        </div>
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

  const SettingsContent = () => {
    const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);
    const { data: profilesRaw = [], isLoading: isLoadingProfiles } = useProfiles({ client });
    const { mutate: unlinkProfile, isPending: isUnlinking } = useUnlinkProfile();
    const { setB3ModalOpen, setB3ModalContentType, isLinking } = useModalStore();

    const profiles = profilesRaw
      .filter((profile: any) => !["custom_auth_endpoint", "siwe"].includes(profile.type))
      .map((profile: any) => ({
        ...getProfileDisplayInfo(profile),
        originalProfile: profile,
      }));

    const handleUnlink = async (profile: any) => {
      setUnlinkingAccountId(profile.title);
      try {
        await unlinkProfile({
          client,
          profileToUnlink: profile.originalProfile,
        });
      } catch (error) {
        console.error("Error unlinking account:", error);
      } finally {
        setUnlinkingAccountId(null);
      }
    };

    const handleOpenLinkModal = () => {
      setB3ModalOpen(true);
      setB3ModalContentType({
        type: "linkAccount",
        showBackButton: true,
        partnerId,
        chain,
        onSuccess: async () => {
          // Let the LinkAccount component handle modal closing
        },
        onError: () => {
          // Let the LinkAccount component handle errors
        },
        onClose: () => {
          // Let the LinkAccount component handle closing
        },
      });
    };

    return (
      <div className="space-y-8">
        {/* Linked Accounts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-b3-grey font-neue-montreal-semibold text-xl">Linked Accounts</h3>
            <Button
              className="bg-b3-primary-wash hover:bg-b3-primary-wash/70 flex items-center gap-2 rounded-full px-4 py-2"
              onClick={handleOpenLinkModal}
              disabled={isLinking}
            >
              {isLinking ? (
                <Loader2 className="text-b3-primary-blue animate-spin" size={16} />
              ) : (
                <LinkIcon size={16} className="text-b3-primary-blue" />
              )}
              <span className="text-b3-grey font-neue-montreal-semibold">
                {isLinking ? "Linking..." : "Link New Account"}
              </span>
            </Button>
          </div>

          {isLoadingProfiles ? (
            <div className="flex justify-center py-8">
              <Loader2 className="text-b3-grey animate-spin" />
            </div>
          ) : profiles.length > 0 ? (
            <div className="space-y-4">
              {profiles.map(profile => (
                <div key={profile.title} className="bg-b3-line flex items-center justify-between rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {profile.imageUrl ? (
                      <img src={profile.imageUrl} alt={profile.title} className="size-10 rounded-full" />
                    ) : (
                      <div className="bg-b3-primary-wash flex h-10 w-10 items-center justify-center rounded-full">
                        <span className="text-b3-grey font-neue-montreal-semibold text-sm uppercase">
                          {profile.initial}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-b3-grey font-neue-montreal-semibold">{profile.title}</span>
                        <span className="text-b3-foreground-muted font-neue-montreal-medium bg-b3-primary-wash rounded px-2 py-0.5 text-xs">
                          {profile.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                        {profile.subtitle}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-b3-grey hover:text-b3-negative"
                    onClick={() => handleUnlink(profile)}
                    disabled={unlinkingAccountId === profile.title || isUnlinking}
                  >
                    {unlinkingAccountId === profile.title || isUnlinking ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <UnlinkIcon size={16} />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-b3-foreground-muted py-8 text-center">No linked accounts found</div>
          )}
        </div>

        {/* Additional Settings Sections */}
        <div className="space-y-4">
          <h3 className="text-b3-grey font-neue-montreal-semibold text-xl">Account Preferences</h3>
          <div className="bg-b3-line rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-b3-grey font-neue-montreal-semibold">Dark Mode</div>
                <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                  Switch between light and dark theme
                </div>
              </div>
              {/* Theme toggle placeholder - can be implemented later */}
              <div className="bg-b3-primary-wash h-6 w-12 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Global Account Info */}
        <div className="border-b3-line flex items-center justify-between rounded-2xl border p-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="https://cdn.b3.fun/b3_logo.svg" alt="B3" className="h-4" />
              <h3 className="font-neue-montreal-semibold text-b3-grey">Global Account</h3>
            </div>

            <p className="text-b3-foreground-muted font-neue-montreal-medium mt-2 text-sm">
              Your universal account for all B3 apps
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

  return (
    <div className="b3-manage-account bg-b3-background flex flex-col rounded-xl">
      <div className="flex-1">
        <TabsPrimitive
          defaultValue={activeTab}
          onValueChange={value => {
            const tab = value as TabValue;
            if (["balance", "tokens", "assets", "apps", "settings"].includes(tab)) {
              (setActiveTab as any)?.(tab);
            }
          }}
        >
          <div className="px-4">
            <TabsListPrimitive
              className="grid !h-auto gap-3 !rounded-none !border-none !bg-transparent"
              style={{ gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)" }}
            >
              <TabTriggerPrimitive
                value="balance"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-16 w-full flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <div className="flex w-full items-center justify-between">
                  <BarChart3 size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                  <span className="text-b3-grey font-neue-montreal-bold text-lg data-[state=active]:text-white">1</span>
                </div>
                <span className="text-b3-grey font-neue-montreal-semibold text-sm data-[state=active]:text-white">
                  Overview
                </span>
              </TabTriggerPrimitive>
              <TabTriggerPrimitive
                value="tokens"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-16 w-full flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <div className="flex w-full items-center justify-between">
                  <Coins size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                  <span className="text-b3-grey font-neue-montreal-bold text-lg data-[state=active]:text-white">2</span>
                </div>
                <span className="text-b3-grey font-neue-montreal-semibold text-sm data-[state=active]:text-white">
                  Tokens
                </span>
              </TabTriggerPrimitive>
              <TabTriggerPrimitive
                value="assets"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-16 w-full flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <div className="flex w-full items-center justify-between">
                  <Image size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                  <span className="text-b3-grey font-neue-montreal-bold text-lg data-[state=active]:text-white">3</span>
                </div>
                <span className="text-b3-grey font-neue-montreal-semibold text-sm data-[state=active]:text-white">
                  Mints
                </span>
              </TabTriggerPrimitive>
              <TabTriggerPrimitive
                value="apps"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-16 w-full flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:text-white data-[state=active]:shadow-lg"
                style={{ gridColumn: "1 / 2" }}
              >
                <div className="flex w-full items-center justify-between">
                  <Grid3X3 size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                  <span className="text-b3-grey font-neue-montreal-bold text-lg data-[state=active]:text-white">4</span>
                </div>
                <span className="text-b3-grey font-neue-montreal-semibold text-sm data-[state=active]:text-white">
                  Apps
                </span>
              </TabTriggerPrimitive>
              <TabTriggerPrimitive
                value="settings"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-16 w-full flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:text-white data-[state=active]:shadow-lg"
                style={{ gridColumn: "2 / 3" }}
              >
                <div className="flex w-full items-center justify-between">
                  <Settings size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                  <span className="text-b3-grey font-neue-montreal-bold text-lg data-[state=active]:text-white">5</span>
                </div>
                <span className="text-b3-grey font-neue-montreal-semibold text-sm data-[state=active]:text-white">
                  Settings
                </span>
              </TabTriggerPrimitive>
            </TabsListPrimitive>
          </div>

          <TabsContentPrimitive value="balance" className="px-4 pb-4 pt-2">
            <BalanceContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="tokens" className="px-4 pb-4 pt-2">
            <TokensContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="assets" className="px-4 pb-4 pt-2">
            <AssetsContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="apps" className="px-4 pb-4 pt-2">
            <AppsContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="settings" className="px-4 pb-4 pt-2">
            <SettingsContent />
          </TabsContentPrimitive>
        </TabsPrimitive>
      </div>
    </div>
  );
}
