export type ReservoirCollectionResponse = {
  collections: ReservoirCollection[];
};

export type ReservoirCollection = {
  chainId: number;
  id: string;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
  name: string;
  symbol: string;
  contractDeployedAt: string;
  image: string;
  banner: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  externalUrl: string | null;
  twitterUsername: string | null;
  openseaVerificationStatus: string | null;
  magicedenVerificationStatus: string | null;
  description: string;
  metadataDisabled: boolean;
  isSpam: boolean;
  isNsfw: boolean;
  isMinting: boolean;
  sampleImages: string[];
  tokenCount: string;
  onSaleCount: string;
  primaryContract: string;
  tokenSetId: string;
  creator: string;
  isSharedContract: boolean;
  royalties:
    | null
    | {
        // Add royalty type if needed
      };
  allRoyalties: {
    eip2981: any[];
    onchain: any[];
  };
  floorAsk: {
    id: string | null;
    price: number | null;
    maker: string | null;
    validFrom: number;
    validUntil: number | null;
    token: any | null;
  };
  topBid: {
    id: string | null;
    sourceDomain: string | null;
    price: number | null;
    maker: string | null;
    validFrom: string | null;
    validUntil: string | null;
  };
  rank: {
    "1day": number | null;
    "7day": number | null;
    "30day": number | null;
    allTime: number | null;
  };
  volume: {
    "1day": number;
    "7day": number;
    "30day": number;
    allTime: number;
  };
  volumeChange: {
    "1day": number | null;
    "7day": number | null;
    "30day": number | null;
  };
  floorSale: {
    "1day": number | null;
    "7day": number | null;
    "30day": number | null;
  };
  floorSaleChange: {
    "1day": number | null;
    "7day": number | null;
    "30day": number | null;
  };
  collectionBidSupported: boolean;
  ownerCount: number;
  contractKind: string;
  mintedTimestamp: number;
  lastMintTimestamp: number;
  mintStages: any[];
  supply: string;
  remainingSupply: string;
};
