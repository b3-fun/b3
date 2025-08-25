import {
  Button,
  ManageAccountModalProps,
  TabsContentPrimitive,
  TabsListPrimitive,
  TabsPrimitive,
  TabTriggerPrimitive,
  TWSignerWithMetadata,
  useAccountAssets,
  useAuthentication,
  useGetAllTWSigners,
  useModalStore,
  useRemoveSessionKey,
} from "@b3dotfun/sdk/global-account/react";
import { SignOutIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SignOutIcon";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";

import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { BarChart3, Coins, Image, LinkIcon, Loader2, Settings, UnlinkIcon } from "lucide-react";
import { useState } from "react";
import { Chain } from "thirdweb";
import { useActiveAccount, useProfiles, useUnlinkProfile } from "thirdweb/react";
import { formatUnits } from "viem";

import { getProfileDisplayInfo } from "../../utils/profileDisplay";
import { AccountAssets } from "../AccountAssets/AccountAssets";
import { ContentTokens } from "./ContentTokens";

import { BalanceContent } from "./BalanceContent";

type TabValue = "overview" | "tokens" | "nfts" | "apps" | "settings";

interface ManageAccountProps {
  onLogout?: () => void;
  onSwap?: () => void;
  onDeposit?: () => void;
  onViewProfile?: () => void;
  chain: Chain;
  partnerId: string;
  containerClassName?: string;
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
  const { data: nfts, isLoading } = useAccountAssets(account?.address);

  const { data: signers, refetch: refetchSigners } = useGetAllTWSigners({
    chain,
    accountAddress: account?.address,
  });
  const { setB3ModalOpen, contentType } = useModalStore();
  const { activeTab = "overview", setActiveTab } = contentType as ManageAccountModalProps;
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

  const AssetsContent = () => (
    <div className="grid grid-cols-3 gap-4">
      {nfts?.nftResponse ? (
        <AccountAssets nfts={nfts.nftResponse} isLoading={isLoading} />
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
        unlinkProfile({ client, profileToUnlink: profile.originalProfile });
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
            if (["overview", "tokens", "nfts", "apps", "settings"].includes(tab)) {
              setActiveTab?.(tab);
            }
          }}
        >
          <div className="px-4">
            <TabsListPrimitive className="grid h-auto grid-cols-2 grid-rows-2 gap-3 rounded-none border-none bg-transparent">
              <TabTriggerPrimitive
                value="overview"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2 text-center shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:shadow-lg"
              >
                <BarChart3 size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                <span className="text-b3-grey font-neue-montreal-semibold text-sm group-data-[state=active]:text-white">
                  Overview
                </span>
              </TabTriggerPrimitive>
              <TabTriggerPrimitive
                value="tokens"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2 text-center shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:shadow-lg"
              >
                <Coins size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                <span className="text-b3-grey font-neue-montreal-semibold text-sm group-data-[state=active]:text-white">
                  Tokens
                </span>
              </TabTriggerPrimitive>
              <TabTriggerPrimitive
                value="nfts"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2 text-center shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:shadow-lg"
              >
                <Image size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                <span className="text-b3-grey font-neue-montreal-semibold text-sm group-data-[state=active]:text-white">
                  NFTs
                </span>
              </TabTriggerPrimitive>
              {/*
              // TODO: Apps is a remnant of session key flow. Moving forward, we should find a way to properly associate apps from linked partners that a user has logged in with
              // https://linear.app/npclabs/issue/B3-2318/find-a-way-to-properly-display-which-partner-apps-a-user-has-logged-in
              <TabTriggerPrimitive
                value="apps"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-16 w-full flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:shadow-lg col-start-1 col-end-2"
              >
                <div className="flex w-full items-center justify-between">
                  <Grid3X3 size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                  <span className="text-b3-grey font-neue-montreal-bold text-lg group-data-[state=active]:text-white">4</span>
                </div>
                <span className="text-b3-grey font-neue-montreal-semibold text-sm group-data-[state=active]:text-white">
                  Apps
                </span>
              </TabTriggerPrimitive>
              */}
              <TabTriggerPrimitive
                value="settings"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2 text-center shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:shadow-lg"
              >
                <Settings size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                <span className="text-b3-grey font-neue-montreal-semibold text-sm group-data-[state=active]:text-white">
                  Settings
                </span>
              </TabTriggerPrimitive>
            </TabsListPrimitive>
          </div>

          <TabsContentPrimitive value="overview" className="px-4 pb-4 pt-2">
            <BalanceContent onLogout={onLogout} partnerId={partnerId} />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="tokens" className="px-4 pb-4 pt-2">
            <ContentTokens activeTab={activeTab} />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="nfts" className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-3 gap-4">
              {nfts?.nftResponse ? (
                <AccountAssets nfts={nfts.nftResponse} isLoading={isLoading} />
              ) : (
                <div className="col-span-3 py-12 text-center text-gray-500">No NFTs found</div>
              )}
            </div>
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
