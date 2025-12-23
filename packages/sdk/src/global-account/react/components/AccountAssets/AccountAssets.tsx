import { NFT, SimpleHashNFTResponse } from "@b3dotfun/sdk/global-account/types/simplehash.types";
import { useState } from "react";

interface AccountAssetsProps {
  nfts: SimpleHashNFTResponse;
  isLoading?: boolean;
}

interface GroupedNFTs {
  collection_id: string;
  collection_name: string;
  collection_image: string;
  nfts: NFT[];
}

export function AccountAssets({ nfts, isLoading }: AccountAssetsProps) {
  // Initialize with all collections expanded
  // Group NFTs by collection
  const groupedNFTs = nfts?.nfts?.reduce(
    (acc, nft) => {
      const collectionId = nft.collection?.collection_id || "unknown";
      if (!acc[collectionId]) {
        acc[collectionId] = {
          collection_id: collectionId,
          collection_name: nft.collection?.name || "Unknown Collection",
          collection_image: nft.collection?.image_url || nft.previews?.image_small_url || "",
          nfts: [],
        };
      }
      acc[collectionId].nfts.push(nft);
      return acc;
    },
    {} as Record<string, GroupedNFTs>,
  );

  const collections = Object.values(groupedNFTs || {});

  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    () => new Set(collections.map(c => c.collection_id)),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-b3-react-muted mb-3 h-6 w-48 rounded" />
            <div className="flex gap-3">
              <div className="bg-b3-react-muted h-[98px] w-[98px] shrink-0 rounded-lg" />
              <div className="bg-b3-react-muted h-[98px] w-[98px] shrink-0 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!nfts?.nfts?.length) {
    return <div className="text-b3-react-muted-foreground py-8 text-center">No NFTs found</div>;
  }

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {collections.map(collection => {
        const isExpanded = expandedCollections.has(collection.collection_id);

        return (
          <div key={collection.collection_id} className="flex flex-col gap-3">
            {/* Collection Header */}
            <button
              onClick={() => toggleCollection(collection.collection_id)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-1">
                {collection.collection_image && (
                  <img
                    src={collection.collection_image}
                    alt={collection.collection_name}
                    className="h-5 w-5 shrink-0 rounded object-cover"
                    onError={e => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <p className="font-neue-montreal-medium text-[14px] text-[#3f3f46]">
                  {collection.collection_name} ({collection.nfts.length})
                </p>
              </div>
              <svg
                className={`h-[18px] w-[18px] shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 6.75L9 11.25L13.5 6.75"
                  stroke="#51525C"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* NFT Grid */}
            {isExpanded && (
              <div className="flex gap-3 overflow-x-auto">
                {collection.nfts.map(nft => (
                  <div
                    key={nft.nft_id}
                    className="bg-b3-react-muted relative h-[98px] w-[98px] shrink-0 overflow-hidden rounded-lg"
                  >
                    <img
                      src={
                        nft.previews?.image_medium_url ||
                        nft.extra_metadata?.image_original_url ||
                        nft.collection?.image_url ||
                        ""
                      }
                      alt={nft.name || "NFT"}
                      className="h-full w-full object-cover"
                      onError={e => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
