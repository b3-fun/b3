import {
  Button,
  CopyToClipboard,
  useAuthentication,
  useB3BalanceFromAddresses,
  useModalStore,
  useNativeBalance,
  useProfile,
} from "@b3dotfun/sdk/global-account/react";
import { BankIcon } from "@b3dotfun/sdk/global-account/react/components/icons/BankIcon";
import { SignOutIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SignOutIcon";
import { SwapIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SwapIcon";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { Loader2, Pencil, Triangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import useFirstEOA from "../../hooks/useFirstEOA";
import { B3TokenIcon, EthereumTokenIcon } from "../TokenIcon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

interface BalanceContentProps {
  onLogout?: () => void;
  partnerId: string;
}

function centerTruncate(str: string, length = 4) {
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

export function BalanceContent({ onLogout, partnerId }: BalanceContentProps) {
  const account = useActiveAccount();
  const { address: eoaAddress, info: eoaInfo } = useFirstEOA();
  const { data: profile } = useProfile({
    address: eoaAddress || account?.address,
    fresh: true,
  });
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();
  const { logout } = useAuthentication(partnerId);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const hasExpandedRef = useRef(false);

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

      console.log("globalAccountTotalUsd", globalAccountTotalUsd);
      console.log("eoaTotalUsd", eoaTotalUsd);

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
  }, [isBothDataReady, globalAccountTotalUsd, eoaTotalUsd]);

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

      {/* Balance Sections with Accordions */}
      <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions} className="space-y-2">
        {/* Global Account Balance Section */}
        <AccordionItem value="global-account" className="border-none">
          <AccordionTrigger className="text-b3-grey font-neue-montreal-semibold py-2 hover:no-underline">
            <span>Balance</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            {/* B3 Balance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full">
                  <B3TokenIcon className="size-10" />
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
                  <EthereumTokenIcon className="size-10" />
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
          </AccordionContent>
        </AccordionItem>

        {/* EOA Account Balance Section */}
        {eoaAddress && (
          <AccordionItem value="eoa-account" className="border-none">
            <AccordionTrigger className="text-b3-grey font-neue-montreal-semibold py-2 hover:no-underline">
              <div className="flex items-center gap-3">
                <span>Connected {eoaInfo?.data?.name || "Wallet"}</span>
                <div className="border-b3-line bg-b3-line/20 hover:bg-b3-line/40 flex w-fit items-center gap-2 rounded-full border px-3 py-1 transition-colors">
                  <span className="text-b3-foreground-muted font-mono text-xs">{centerTruncate(eoaAddress, 6)}</span>
                  <CopyToClipboard text={eoaAddress} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* EOA B3 Balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full">
                    <B3TokenIcon className="size-10" />
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
                    <EthereumTokenIcon className="size-10" />
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
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Sign Out */}
      <button
        className="border-b3-line hover:bg-b3-line relative flex w-full items-center justify-center rounded-2xl border p-4 transition-colors"
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
