import { useActiveWallet } from "thirdweb/react";
import { AccountAssets } from "..";
import { useSimCollectibles } from "../../hooks";

const NFTContent = () => {
  // Get active wallet state
  const activeWallet = useActiveWallet();
  const activeAccount = activeWallet?.getAccount();
  const activeAddress = activeAccount?.address;

  const { data: nfts, isLoading } = useSimCollectibles(activeAddress, [1, 8453], { filterSpam: true });

  return (
    <div style={{ minHeight: "100px" }}>
      {nfts ? (
        <AccountAssets nfts={nfts} isLoading={isLoading} />
      ) : (
        <div className="py-12 text-center text-gray-500">No NFTs found</div>
      )}
    </div>
  );
};

export default NFTContent;
