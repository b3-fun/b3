import {
  WalletCoinbase,
  WalletMetamask,
  WalletPhantom,
  WalletRabby,
  WalletRainbow,
  WalletWalletConnect,
} from "@web3icons/react";
import { Wallet } from "lucide-react";

const getWalletIcon = (connectorType: string, size = 24) => {
  switch (connectorType?.toLowerCase()) {
    case "metamask":
      return <WalletMetamask width={size} height={size} />;
    case "coinbase":
      return <WalletCoinbase width={size} height={size} />;
    case "phantom":
      return <WalletPhantom width={size} height={size} />;
    case "walletconnect":
      return <WalletWalletConnect width={size} height={size} />;
    case "rabby":
      return <WalletRabby width={size} height={size} />;
    case "rainbow":
      return <WalletRainbow width={size} height={size} />;
    default:
      return <Wallet width={size} height={size} />;
  }
};

export function WalletConnectorIcon({ connectorType, size = 24 }: { connectorType: string; size?: number }) {
  return getWalletIcon(connectorType, size);
}
