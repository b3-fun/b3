import { Token } from "@b3dotfun/sdk/anyspend/types";

export interface NftContract {
  chainId: number;
  contractAddress: string;
  price: string;
  priceFormatted: string;
  currency: Token;
  imageUrl: string;
  name: string;
  description: string;
  tokenId: number | null;
}
