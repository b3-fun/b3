import { CopyToClipboard } from "@b3dotfun/sdk/global-account/react";
import { useActiveAccount } from "thirdweb/react";
import { ChevronDownIcon } from "../icons/ChevronDownIcon";
import { WalletIcon } from "../icons/WalletIcon";

function centerTruncate(str: string, length = 4) {
  if (!str) return "";
  if (str.length <= length * 2) return str;
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

export function Header() {
  const account = useActiveAccount();

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
    </div>
  );
}
