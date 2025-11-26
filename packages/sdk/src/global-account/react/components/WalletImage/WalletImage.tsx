import { useAccountWalletImage } from "../../hooks/useAccountWallet";
import { IPFSMediaRenderer } from "../IPFSMediaRenderer/IPFSMediaRenderer";

const WalletImage = ({ fallback }: { fallback?: React.ReactNode }) => {
  const walletImage = useAccountWalletImage();
  if (walletImage) {
    return <IPFSMediaRenderer src={walletImage} alt="Profile" className="h-6 w-6 rounded-full" />;
  }
  return fallback || null;
};

export default WalletImage;
