import { useActiveAccount } from "thirdweb/react";
import { AccountAssets } from "..";
import { useAccountAssets } from "../../hooks";

const NFTContent = () => {
  const account = useActiveAccount();
  const { data: nfts, isLoading } = useAccountAssets(account?.address);

  return (
    <div className="grid grid-cols-3 gap-4" style={{ minHeight: "100px" }}>
      {nfts?.nftResponse ? (
        <AccountAssets nfts={nfts.nftResponse} isLoading={isLoading} />
      ) : (
        <div className="col-span-3 py-12 text-center text-gray-500">No NFTs found</div>
      )}
    </div>
  );
};

export default NFTContent;
