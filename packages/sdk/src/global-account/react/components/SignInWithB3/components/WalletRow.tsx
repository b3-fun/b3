import { WalletIcon, WalletName, WalletProvider } from "thirdweb/react";
import { WalletId } from "thirdweb/wallets";
import { Button } from "../../custom/Button";

export function WalletRow({
  walletId,
  onClick,
  isLoading,
}: {
  walletId: WalletId;
  onClick: () => void;
  isLoading: boolean;
}) {
  return (
    <WalletProvider key={walletId} id={walletId as WalletId}>
      <Button
        onClick={onClick}
        disabled={isLoading}
        className="flex w-full items-center justify-normal gap-3 rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
      >
        <WalletIcon
          className="h-12 w-12"
          loadingComponent={<div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />}
        />
        <WalletName
          className="font-bold text-gray-900 dark:text-gray-100"
          loadingComponent={<div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />}
        />
      </Button>
    </WalletProvider>
  );
}
