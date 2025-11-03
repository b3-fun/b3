import {
  CopyToClipboard,
  ManageAccountModalProps,
  useAuthentication,
  useModalStore,
} from "@b3dotfun/sdk/global-account/react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useActiveWallet, useConnectedWallets, useSetActiveWallet, useWalletImage } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";
import { ChevronDownIcon } from "../icons/ChevronDownIcon";
import LinkIcon from "../icons/LinkIcon";
import SignOutIcon from "../icons/SignOutIcon";
import { WalletIcon } from "../icons/WalletIcon";

function centerTruncate(str: string, length = 4) {
  if (!str) return "";
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

// Check icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M16.6668 5L7.50016 14.1667L3.3335 10"
      stroke="#0C68E9"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Wallet item component
function WalletItem({ wallet, isActive, onClick }: { wallet: Wallet; isActive: boolean; onClick: () => void }) {
  const account = wallet.getAccount();
  const address = account?.address || "";
  const { data: walletImage } = useWalletImage(wallet.id);

  // Get wallet name from wallet metadata
  const walletName = wallet.id.includes("coinbase")
    ? "Coinbase Wallet"
    : wallet.id.includes("metamask")
      ? "MetaMask Wallet"
      : wallet.id.includes("phantom")
        ? "Phantom Wallet"
        : wallet.id.includes("walletConnect")
          ? "WalletConnect"
          : wallet.id.includes("ecosystem")
            ? "Smart Wallet"
            : "Wallet";

  return (
    <div
      className={`box-border flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
        isActive ? "bg-b3-line" : "hover:bg-b3-line/50"
      }`}
      onClick={onClick}
    >
      <div className="bg-b3-line relative size-10 shrink-0 overflow-clip rounded-full">
        {walletImage ? (
          <img src={walletImage} alt={walletName} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <WalletIcon />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-b3-grey font-neue-montreal-semibold truncate text-sm">{walletName}</p>
        <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">{centerTruncate(address, 4)}</p>
      </div>
      {isActive && (
        <div className="shrink-0">
          <CheckIcon />
        </div>
      )}
    </div>
  );
}

export function Header({ onLogout }: { onLogout?: () => void }) {
  const activeWallet = useActiveWallet();
  const connectedWallets = useConnectedWallets();
  const setActiveWallet = useSetActiveWallet();
  const contentType = useModalStore(state => state.contentType) as ManageAccountModalProps;
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const partnerId = contentType?.partnerId;

  const { logout } = useAuthentication(partnerId);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const account = activeWallet?.getAccount();
  const address = account?.address || "";

  const onLogoutEnhanced = async () => {
    setLogoutLoading(true);
    await logout();
    onLogout?.();
    setB3ModalOpen(false);
    setLogoutLoading(false);
  };

  const handleWalletSwitch = (wallet: Wallet) => {
    setActiveWallet(wallet);
  };

  const handleLinkWallet = () => {
    setB3ModalContentType({
      type: "linkNewAccount",
      showBackButton: true,
      partnerId,
      chain: contentType?.chain,
      onSuccess: async () => {
        // Success handled by LinkAccount component
      },
    });
  };

  return (
    <AccordionPrimitive.Root type="single" collapsible className="bg-b3-background border-b3-line border-b">
      <AccordionPrimitive.Item value="wallet-switcher" className="border-none">
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between border-none bg-transparent px-5 py-3 outline-none">
          <div className="flex items-center gap-2">
            <WalletIcon />
            <div className="flex flex-col gap-0.5">
              <p className="text-b3-grey font-neue-montreal-semibold text-sm">Active Wallet</p>
              <div className="flex items-center gap-1">
                <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                  {centerTruncate(address, 4)}
                </p>
                <CopyToClipboard text={address} />
              </div>
            </div>
          </div>
          <ChevronDownIcon className="text-b3-grey transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </AccordionPrimitive.Trigger>

        <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
          <div className="flex flex-col gap-3 rounded-bl-3xl rounded-br-3xl bg-white px-2 pb-5 pt-3 shadow-[0px_32px_64px_-12px_rgba(10,13,18,0.14),0px_5px_5px_-2.5px_rgba(10,13,18,0.04)]">
            {/* Connected Wallets */}
            <div className="flex flex-col gap-3">
              {connectedWallets.map(wallet => (
                <WalletItem
                  key={wallet.id}
                  wallet={wallet}
                  isActive={activeWallet?.id === wallet.id}
                  onClick={() => handleWalletSwitch(wallet)}
                />
              ))}

              {/* Link Another Wallet */}
              <div
                className="hover:bg-b3-line/50 box-border flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors"
                onClick={handleLinkWallet}
              >
                <div className="bg-b3-line flex size-10 shrink-0 items-center justify-center rounded-full">
                  <LinkIcon className="text-b3-grey" />
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-b3-grey font-neue-montreal-semibold text-sm">Link another wallet</p>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              className="border-b3-line hover:bg-b3-line bg-b3-background flex items-center justify-center gap-1.5 rounded-xl border border-solid p-2.5 transition-colors"
              onClick={onLogoutEnhanced}
              disabled={logoutLoading}
              style={{
                boxShadow: "inset 0px 0px 0px 1px rgba(10,13,18,0.18), inset 0px -2px 0px 0px rgba(10,13,18,0.05)",
              }}
            >
              {logoutLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <SignOutIcon size={20} className="text-b3-grey" />
              )}
              <p className="text-b3-grey font-neue-montreal-semibold text-base">Sign out</p>
            </button>
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}
