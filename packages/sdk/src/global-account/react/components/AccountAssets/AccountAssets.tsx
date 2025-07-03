import { SimpleHashNFTResponse } from "@b3dotfun/sdk/global-account/types/simplehash.types";

interface AccountAssetsProps {
  nfts: SimpleHashNFTResponse;
  isLoading?: boolean;
}

export function AccountAssets({ nfts, isLoading }: AccountAssetsProps) {
  if (isLoading) {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-b3-react-muted aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!nfts?.nfts?.length) {
    return <div className="text-b3-react-muted-foreground py-8 text-center">No NFTs found</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {nfts.nfts.map(nft => (
        <div key={nft.nft_id} className="group relative aspect-square overflow-hidden">
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <img
              src={
                nft.previews?.image_medium_url || nft.extra_metadata?.image_original_url || nft.collection?.image_url
              }
              alt={nft.name || "NFT"}
              className="h-full w-full rounded-xl object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black from-35% via-black/70 to-transparent p-3 opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100">
              <p className="font-neue-montreal-bold text-[16px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                {nft.name || `#${nft.token_id}`}
              </p>
              <p className="font-neue-montreal-bold text-sm text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                {nft.collection?.name}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
