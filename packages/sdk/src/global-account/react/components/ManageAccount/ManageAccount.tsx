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
  useB3,
  useB3BalanceFromAddresses,
  useGetAllTWSigners,
  useModalStore,
  useNativeBalance,
  useRemoveSessionKey,
} from "@b3dotfun/sdk/global-account/react";
import { formatAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { ArrowRightLeft } from "lucide-react";
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
  const { automaticallySetFirstEoa } = useB3();
  const [activeTab, setActiveTab] = useState("balance");
  const [revokingSignerId, setRevokingSignerId] = useState<string | null>(null);
  const account = useActiveAccount();
  const {
    address: eoaAddress,
    info: { data: eoaInfo },
  } = useFirstEOA();
  const { data: assets, isLoading } = useAccountAssets(account?.address);
  const { data: b3Balance } = useB3BalanceFromAddresses(account?.address);
  const { data: nativeBalance } = useNativeBalance(account?.address);
  const { data: eoaNativeBalance } = useNativeBalance(eoaAddress);
  const { data: eoaB3Balance } = useB3BalanceFromAddresses(eoaAddress);
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
    <div className="flex h-full flex-col items-center justify-between gap-8">
      <div className="w-full">
        <div className="border-b3-react-border bg-b3-react-subtle flex flex-col rounded-lg border p-4">
          <div className="mb-4 flex items-center gap-3">
            <img src="https://cdn.b3.fun/b3_logo.svg" alt="B3" className="h-6 w-6" />
            <h2 className="font-neue-montreal-bold text-b3-react-primary text-lg">Global Account</h2>
          </div>

          {!automaticallySetFirstEoa && (
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <img src="https://cdn.b3.fun/b3-coin-3d.png" alt="B3" className="h-10 w-10" />
                <span className="font-neue-montreal-bold text-2xl">{b3Balance?.formattedTotal || "--"} B3</span>
              </div>
              <div className="border-b3-react-border my-4 border-t" />
              <div className="flex items-center gap-4">
                <img src="https://cdn.b3.fun/ethereum.svg" alt="ETH" className="h-10 w-10" />
                <span className="font-neue-montreal-bold text-2xl">{nativeBalance?.formattedTotal || "--"} ETH</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-b3-react-secondary-foreground text-sm">Your universal account for all B3-powered apps</p>
            <div className="flex items-center gap-2">
              <span className="text-b3-react-muted-foreground font-mono text-sm">
                {centerTruncate(account?.address || "", 6)}
              </span>
              <CopyToClipboard text={account?.address || ""} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b3-react-border bg-b3-react-subtle w-full rounded-lg border p-4">
        {eoaAddress && (
          <>
            <div>
              <h3 className="font-neue-montreal-bold text-b3-react-primary mb-2">Connected {eoaInfo?.name}</h3>
              <div className="flex items-center gap-4">
                <img src="https://cdn.b3.fun/ethereum.svg" alt="ETH" className="h-10 w-10" />
                <span className="font-neue-montreal-bold text-2xl">{eoaNativeBalance?.formattedTotal || "--"} ETH</span>
              </div>
              <div className="border-b3-react-border my-4 border-t" />
              <div className="flex items-center gap-4">
                <img src="https://cdn.b3.fun/b3-coin-3d.png" alt="B3" className="h-10 w-10" />
                <span className="font-neue-montreal-bold text-2xl">{eoaB3Balance?.formattedTotal || "--"} B3</span>
              </div>
              <div className="text-b3-react-muted-foreground mt-2">
                <span className="font-mono text-sm">{centerTruncate(eoaAddress, 6)}</span>
                <CopyToClipboard text={eoaAddress} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex w-full gap-4">
        <Button
          className="font-neue-montreal-medium flex-1"
          onClick={() => {
            setB3ModalOpen(true);
            setB3ModalContentType({
              type: "anySpend",
              defaultActiveTab: "fiat",
              showBackButton: true,
            });
          }}
        >
          Deposit
        </Button>
        <Button
          variant="default"
          className="font-neue-montreal-medium flex-1"
          onClick={() => {
            setB3ModalOpen(true);
            setB3ModalContentType({
              type: "anySpend",
              showBackButton: true,
            });
          }}
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Swap
        </Button>
      </div>
    </div>
  );

  const AssetsContent = () => (
    <div className="bg-b3-react-card border-b3-react-border rounded-lg border p-4">
      {assets?.nftResponse && <AccountAssets nfts={assets.nftResponse} isLoading={isLoading} />}
    </div>
  );

  const AppsContent = () => (
    <div className="bg-b3-react-card border-b3-react-border rounded-lg border p-4">
      {signers?.map((signer: TWSignerWithMetadata) => (
        <div
          key={signer.id}
          className="border-b3-react-border flex items-center justify-between border-b py-4 last:border-b-0"
        >
          <div className="flex items-center gap-4">
            <div className="bg-b3-react-muted flex h-8 w-8 items-center justify-center rounded-full">
              <span className="text-b3-react-muted-foreground text-xs">App</span>
            </div>
            <div className="flex flex-col">
              <span className="font-neue-montreal-bold mb-2 text-base">{signer.partner.name}</span>
              <div className="text-b3-react-muted-foreground flex flex-col gap-1.5">
                <span className="text-b3-react-muted-foreground font-mono text-xs">
                  Added: {new Date(signer.createdAt).toLocaleDateString()}
                </span>
                <span className="text-b3-react-muted-foreground font-mono text-xs">
                  Expires: {new Date(Number(signer.endTimestamp) * 1000).toLocaleDateString()}
                </span>
                <span className="text-b3-react-muted-foreground font-mono text-xs">
                  Max spend: {formatNumber(Number(formatUnits(signer.nativeTokenLimitPerTransaction, 18)))} ETH
                </span>
                <span className="text-b3-react-muted-foreground font-mono text-xs">
                  Approved Contracts: {signer.approvedTargets.map(formatAddress).join(", ")}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-0 bg-red-500/80 px-4 text-xs font-medium text-white hover:bg-red-600/90"
            onClick={() => handleRevoke(signer)}
            disabled={revokingSignerId === signer.id}
          >
            {revokingSignerId === signer.id ? "Revoking..." : "Revoke"}
          </Button>
        </div>
      ))}

      {!signers?.length && <div className="text-b3-react-muted-foreground py-8 text-center">No connected apps</div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex-1">
        <TabsPrimitive defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsListPrimitive className="mb-4 w-full">
            <TabTriggerPrimitive value="balance" className="font-neue-montreal-bold text-base">
              Balance
            </TabTriggerPrimitive>
            <TabTriggerPrimitive value="assets" className="font-neue-montreal-bold text-base">
              NFTs
            </TabTriggerPrimitive>
            <TabTriggerPrimitive value="apps" className="font-neue-montreal-bold text-base">
              Apps
            </TabTriggerPrimitive>
          </TabsListPrimitive>

          <TabsContentPrimitive value="balance">
            <BalanceContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="assets">
            <AssetsContent />
          </TabsContentPrimitive>

          <TabsContentPrimitive value="apps">
            <AppsContent />
          </TabsContentPrimitive>
        </TabsPrimitive>
      </div>

      <div className="flex flex-col gap-2">
        <div className="border-b3-react-border border-t" />
        <Button
          variant="outline"
          size="sm"
          className="font-neue-montreal-medium text-b3-react-muted-foreground hover:text-b3-react-foreground"
          onClick={onLogoutEnhanced}
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
