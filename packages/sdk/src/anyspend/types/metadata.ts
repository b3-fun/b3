import { NftContract } from "./nft";
import { OrderType } from "./order";

export type BaseMetadata = {
  type: OrderType;
};

export type NftMetadata = BaseMetadata & {
  type: OrderType.MintNFT;
  nftContract: NftContract;
};

export type TournamentMetadata = BaseMetadata & {
  type: OrderType.JoinTournament | OrderType.FundTournament;
  tournament: {
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
  };
};

export type CustomTxMetadata = BaseMetadata & {
  type: OrderType.Custom;
  action: string;
};

export type AnySpendMetadata = NftMetadata | TournamentMetadata | CustomTxMetadata;

// Type guard functions
export function isNftMetadata(metadata: AnySpendMetadata): metadata is NftMetadata {
  return metadata.type === OrderType.MintNFT;
}

export function isTournamentMetadata(metadata: AnySpendMetadata): metadata is TournamentMetadata {
  return metadata.type === OrderType.JoinTournament || metadata.type === OrderType.FundTournament;
}

export function isCustomTxMetadata(metadata: AnySpendMetadata): metadata is CustomTxMetadata {
  return metadata.type === OrderType.Custom;
}
