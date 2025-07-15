import { z } from "zod";

import { Token, zToken } from "./token";

export enum NftType {
  ERC721 = "erc721",
  ERC1155 = "erc1155",
}

export const zBaseNft = z.object({
  type: z.nativeEnum(NftType),
  contractAddress: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
});

export const zNft = z.discriminatedUnion("type", [
  zBaseNft.extend({
    type: z.literal(NftType.ERC721),
  }),
  zBaseNft.extend({
    type: z.literal(NftType.ERC1155),
    tokenId: z.number(),
    imageUrl: z.string(),
  }),
]);
export type Nft = z.infer<typeof zNft>;

export const zMintNftPayload = z.object({
  contractAddress: z.string(),
  tokenId: z.number().nullable(),
  contractType: z.nativeEnum(NftType),
  nftPrice: z.string(),
});

export const zMintNftMetadata = z.object({
  srcToken: zToken,
  dstToken: zToken,
  nft: zNft,
});

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
  type: NftType;
}
