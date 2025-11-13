import { useActiveWallet } from "thirdweb/react";
import { AccountAssets } from "..";
import { useAccountAssets } from "../../hooks";

const NFTContent = () => {
  // Get active wallet state
  const activeWallet = useActiveWallet();
  const activeAccount = activeWallet?.getAccount();
  const activeAddress = activeAccount?.address;

  const { data: nfts, isLoading } = useAccountAssets(activeAddress);

  return (
    <div style={{ minHeight: "100px" }}>
      {nfts?.nftResponse ? (
        <AccountAssets nfts={nfts.nftResponse} isLoading={isLoading} />
      ) : (
        <div className="py-12 text-center text-gray-500">No NFTs found</div>
      )}
    </div>
  );
};

export default NFTContent;
