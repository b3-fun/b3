import {
  CopyToClipboard,
  ManageAccountModalProps,
  useAuthentication,
  useModalStore,
} from "@b3dotfun/sdk/global-account/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ChevronDownIcon } from "../icons/ChevronDownIcon";
import SignOutIcon from "../icons/SignOutIcon";
import { WalletIcon } from "../icons/WalletIcon";

function centerTruncate(str: string, length = 4) {
  if (!str) return "";
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

export function Header({ onLogout }: { onLogout?: () => void }) {
  const account = useActiveAccount();
  const contentType = useModalStore(state => state.contentType) as ManageAccountModalProps;
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  console.log("contentType :", contentType);
  const partnerId = contentType?.partnerId;

  const { logout } = useAuthentication(partnerId);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const onLogoutEnhanced = async () => {
    setLogoutLoading(true);
    await logout();
    onLogout?.();
    setB3ModalOpen(false);
    setLogoutLoading(false);
  };

  return (
    <div className="bg-b3-background border-b3-line flex items-center justify-between border-b px-5 py-3">
      <div className="flex items-center gap-2">
        <WalletIcon />
        <div className="flex flex-col gap-0.5">
          <p className="text-b3-grey font-neue-montreal-semibold text-sm">Active Wallet</p>
          <div className="flex items-center gap-1">
            <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
              {centerTruncate(account?.address || "", 4)}
            </p>
            <CopyToClipboard text={account?.address || ""} />
          </div>
        </div>
      </div>
      <ChevronDownIcon className="text-b3-grey" />
      <button
        className="logout-button logout-section border-b3-line hover:bg-b3-line relative flex w-full items-center justify-center rounded-2xl border p-4 transition-colors"
        onClick={onLogoutEnhanced}
      >
        <span className="logout-text font-neue-montreal-semibold text-b3-grey">Sign out</span>
        <div className="logout-icon-container absolute right-4">
          {logoutLoading ? (
            <Loader2 className="logout-loading animate-spin" size={16} />
          ) : (
            <SignOutIcon size={16} className="logout-icon text-b3-grey" />
          )}
        </div>
      </button>
    </div>
  );
}
