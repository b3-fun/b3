import {
  ManageAccountModalProps,
  TabsContentPrimitive,
  TabsListPrimitive,
  TabsPrimitive,
  TabTriggerPrimitive,
  useAccountAssets,
  useModalStore,
} from "@b3dotfun/sdk/global-account/react";
import { truncateAddress } from "@b3dotfun/sdk/shared/utils/truncateAddress";
import { BarChart3, Coins, Image, Settings } from "lucide-react";
import { Chain } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

import { AccountAssets } from "../AccountAssets/AccountAssets";
import { ContentTokens } from "./ContentTokens";

// Helper function to check if a string is a wallet address and format it
const formatProfileTitle = (title: string): { displayTitle: string; isAddress: boolean } => {
  // Check if title looks like an Ethereum address (0x followed by 40 hex characters)
  const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(title);

  if (isEthereumAddress) {
    return {
      displayTitle: truncateAddress(title),
      isAddress: true,
    };
  }

  return {
    displayTitle: title,
    isAddress: false,
  };
};

import AppsContent from "./AppsContent";
import { BalanceContent } from "./BalanceContent";
import SettingsContent from "./SettingsContent";

type TabValue = "home" | "tokens" | "nfts" | "apps" | "settings";

interface ManageAccountProps {
  onLogout?: () => void;
  onSwap?: () => void;
  onDeposit?: () => void;
  onViewProfile?: () => void;
  chain: Chain;
  partnerId: string;
  containerClassName?: string;
  showSwap?: boolean;
  showDeposit?: boolean;
}

export function ManageAccount({
  onLogout,
  onSwap: _onSwap,
  onDeposit: _onDeposit,
  chain,
  partnerId,
  showSwap,
  showDeposit,
}: ManageAccountProps) {
  const account = useActiveAccount();
  const { data: nfts, isLoading } = useAccountAssets(account?.address);

  const contentType = useModalStore(state => state.contentType);
  const { activeTab = "home", setActiveTab } = contentType as ManageAccountModalProps;

  return (
    <div className="b3-manage-account bg-b3-background flex flex-col rounded-xl">
      <div className="flex-1">
        <TabsPrimitive
          defaultValue={activeTab}
          onValueChange={value => {
            const tab = value as TabValue;
            if (["home", "tokens", "nfts", "apps", "settings"].includes(tab)) {
              setActiveTab?.(tab);
            }
          }}
        >
          <div className="px-4">
            <TabsListPrimitive className="grid h-auto grid-cols-2 grid-rows-2 gap-3 rounded-none border-none bg-transparent">
              <TabTriggerPrimitive
                value="home"
                className="data-[state=active]:bg-b3-primary-blue data-[state=active]:hover:bg-b3-primary-blue data-[state=active]:border-b3-primary-blue group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2 text-center shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md data-[state=active]:shadow-lg"
              >
                <BarChart3 size={20} className="text-b3-primary-blue shrink-0 group-data-[state=active]:text-white" />
                <span className="text-b3-grey font-neue-montreal-semibold text-sm group-data-[state=active]:text-white">
                  Home
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

          <TabsContentPrimitive value="home" className="px-4 pb-4 pt-2">
            <BalanceContent onLogout={onLogout} showDeposit={showDeposit} showSwap={showSwap} />
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
            <AppsContent chain={chain} partnerId={partnerId} />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="settings" className="px-4 pb-4 pt-2">
            <SettingsContent partnerId={partnerId} onLogout={onLogout} chain={chain} />
          </TabsContentPrimitive>
        </TabsPrimitive>
      </div>
    </div>
  );
}
