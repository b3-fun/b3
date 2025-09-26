import {
  Button,
  CopyToClipboard,
  useAuthentication,
  useB3,
  useB3BalanceFromAddresses,
  useModalStore,
  useNativeBalance,
  useProfile,
} from "@b3dotfun/sdk/global-account/react";
import { BankIcon } from "@b3dotfun/sdk/global-account/react/components/icons/BankIcon";
import { SignOutIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SignOutIcon";
import { SwapIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SwapIcon";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { getIpfsUrl } from "@b3dotfun/sdk/shared/utils/ipfs";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useFirstEOA } from "../../hooks/useFirstEOA";
import { B3TokenIcon, EthereumTokenIcon } from "../TokenIcon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { TokenBalanceRow } from "./TokenBalanceRow";

interface BalanceContentProps {
  onLogout?: () => void;
  partnerId: string;
  showDeposit?: boolean;
  showSwap?: boolean;
}

function centerTruncate(str: string, length = 4) {
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

export function BalanceContent({ onLogout, partnerId, showDeposit = true, showSwap = true }: BalanceContentProps) {
  const account = useActiveAccount();
  const { address: eoaAddress, info: eoaInfo } = useFirstEOA();
  const { data: profile } = useProfile({
    address: eoaAddress || account?.address,
    fresh: true,
  });
  const { user } = useB3();
  const { setB3ModalOpen, setB3ModalContentType, navigateBack } = useModalStore();
  const { logout } = useAuthentication();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const hasExpandedRef = useRef(false);

  const avatarUrl = user?.avatar ? getIpfsUrl(user?.avatar) : profile?.avatar;

  const handleEditAvatar = () => {
    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "avatarEditor",
      showBackButton: true,
      onSuccess: () => {
        // navigate back on success
        navigateBack();
      },
    });
  };

  console.log("eoaAddress", eoaAddress);
  console.log("account?.address", account?.address);

  // Balance data fetching
  const { data: eoaNativeBalance, isLoading: eoaNativeLoading } = useNativeBalance(eoaAddress);
  const { data: eoaB3Balance, isLoading: eoaB3Loading } = useB3BalanceFromAddresses(eoaAddress);
  const { data: b3Balance, isLoading: b3Loading } = useB3BalanceFromAddresses(account?.address);
  const { data: nativeBalance, isLoading: nativeLoading } = useNativeBalance(account?.address);

  // Calculate total USD values for comparison
  const globalAccountTotalUsd = (b3Balance?.balanceUsd || 0) + (nativeBalance?.totalUsd || 0);
  const eoaTotalUsd = (eoaB3Balance?.balanceUsd || 0) + (eoaNativeBalance?.totalUsd || 0);

  // Check if both data sets are ready (not loading and have data)
  const isGlobalDataReady = !b3Loading && !nativeLoading && b3Balance !== undefined && nativeBalance !== undefined;
  const isEoaDataReady =
    !eoaAddress || (!eoaB3Loading && !eoaNativeLoading && eoaB3Balance !== undefined && eoaNativeBalance !== undefined);
  const isBothDataReady = isGlobalDataReady && isEoaDataReady;

  // Reset expansion flag when component mounts
  useEffect(() => {
    hasExpandedRef.current = false;
    setOpenAccordions([]);
  }, []);

  // Auto-expand the appropriate section when data becomes ready
  useEffect(() => {
    if (isBothDataReady && !hasExpandedRef.current && eoaAddress && account?.address) {
      hasExpandedRef.current = true;

      // Determine which section to expand based on higher balance
      if (globalAccountTotalUsd === 0 && eoaTotalUsd === 0) {
        // If both have 0 balance, expand global account by default
        setOpenAccordions(["global-account"]);
      } else if (globalAccountTotalUsd >= eoaTotalUsd) {
        setOpenAccordions(["global-account"]);
      } else {
        setOpenAccordions(["eoa-account"]);
      }
    }
  }, [isBothDataReady, globalAccountTotalUsd, eoaTotalUsd, eoaAddress, account?.address]);

  const onLogoutEnhanced = async () => {
    setLogoutLoading(true);
    await logout();
    onLogout?.();
    setB3ModalOpen(false);
    setLogoutLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Section */}
      <div className="flex items-center justify-between">
        <div className="global-account-profile flex items-center gap-4">
          <div className="global-account-profile-avatar relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="size-24 rounded-full" />
            ) : (
              <div className="bg-b3-primary-wash size-24 rounded-full" />
            )}
            <button
              onClick={handleEditAvatar}
              className="bg-b3-grey border-b3-background hover:bg-b3-grey/80 absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-4 transition-colors"
            >
              <Pencil size={16} className="text-b3-background" />
            </button>
          </div>
          <div className="global-account-profile-info">
            <h2 className="text-b3-grey text-xl font-semibold">
              {profile?.displayName || formatUsername(profile?.name || "")}
            </h2>
            <div className="address-button border-b3-line bg-b3-line/20 hover:bg-b3-line/40 flex w-fit items-center gap-2 rounded-full border px-3 py-1 transition-colors">
              <span className="text-b3-foreground-muted font-mono text-xs">
                {centerTruncate(account?.address || "", 6)}
              </span>
              <CopyToClipboard text={account?.address || ""} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(showDeposit || showSwap) && (
        <div className="grid grid-cols-2 gap-3">
          {showDeposit && (
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
          )}
          {showSwap && (
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
          )}
        </div>
      )}

      {/* Balance Sections with Accordions */}
      <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions} className="space-y-2">
        {/* Global Account Balance Section */}
        <AccordionItem value="global-account" className="border-none">
          <AccordionTrigger className="text-b3-grey font-neue-montreal-semibold py-2 hover:no-underline">
            <span>Balance</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <TokenBalanceRow
              icon={<B3TokenIcon className="size-10" />}
              name="B3"
              balance={`${b3Balance?.formattedTotal || "0.00"} B3`}
              usdValue={b3Balance?.balanceUsdFormatted || "0.00"}
              priceChange={b3Balance?.priceChange24h}
            />
            <TokenBalanceRow
              icon={<EthereumTokenIcon className="size-10" />}
              name="Ethereum"
              balance={`${nativeBalance?.formattedTotal || "0.00"} ETH`}
              usdValue={nativeBalance?.formattedTotalUsd || "0.00"}
              priceChange={nativeBalance?.priceChange24h}
            />
          </AccordionContent>
        </AccordionItem>

        {/* EOA Account Balance Section */}
        {eoaAddress && (
          <AccordionItem value="eoa-account" className="border-none">
            <AccordionTrigger className="text-b3-grey font-neue-montreal-semibold py-2 hover:no-underline">
              <div className="flex items-center gap-3">
                <span>Connected {eoaInfo?.data?.name || "Wallet"}</span>
                <div className="address-button border-b3-line bg-b3-line/20 hover:bg-b3-line/40 flex w-fit items-center gap-2 rounded-full border px-3 py-1 transition-colors">
                  <span className="text-b3-foreground-muted font-mono text-xs">{centerTruncate(eoaAddress, 6)}</span>
                  <CopyToClipboard text={eoaAddress} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <TokenBalanceRow
                icon={<B3TokenIcon className="size-10" />}
                name="B3"
                balance={`${eoaB3Balance?.formattedTotal || "0.00"} B3`}
                usdValue={eoaB3Balance?.balanceUsdFormatted || "0.00"}
                priceChange={eoaB3Balance?.priceChange24h}
              />
              <TokenBalanceRow
                icon={<EthereumTokenIcon className="size-10" />}
                name="Ethereum"
                balance={`${eoaNativeBalance?.formattedTotal || "0.00"} ETH`}
                usdValue={eoaNativeBalance?.formattedTotalUsd || "0.00"}
                priceChange={eoaNativeBalance?.priceChange24h}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Sign Out */}
      <button
        className="logout-button border-b3-line hover:bg-b3-line relative flex w-full items-center justify-center rounded-2xl border p-4 transition-colors"
        onClick={onLogoutEnhanced}
      >
        <span className="font-neue-montreal-semibold text-b3-grey">Sign out</span>
        <div className="absolute right-4">
          {logoutLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <SignOutIcon size={16} className="text-b3-grey" />
          )}
        </div>
      </button>
    </div>
  );
}
