import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";

import { NftContract } from "./types";

export const NFT_CONTRACTS: NftContract[] = [
  {
    chainId: B3_TOKEN.chainId,
    contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
    price: "500000000000000000",
    priceFormatted: "0.5",
    currency: B3_TOKEN,
    imageUrl:
      "https://storage.googleapis.com/nftimagebucket/base/tokens/0x80f0e6644723abb03aa8867d21e32bd854b2a2d9/preview/TVRjME1EUTRORFl4T0E9PV8zNjcy.jpg",
    name: "Downhill Ski",
    description: "Downhill Ski",
    tokenId: null,
  },
];

export const DEFAULT_NFT_CONTRACT = NFT_CONTRACTS[0];
