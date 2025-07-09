import { Nft, NftType, OrderType, Token, Tournament } from "@b3dotfun/sdk/anyspend/types";
import { normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";

export type OrderParams = {
  orderType: OrderType;
  srcToken: Token;
  dstToken: Token;
  expectedDstAmount?: string;
  nft?: Nft & { price: string };
  tournament?: Tournament & { contractAddress: string; entryPriceOrFundAmount: string };
  payload?: any;
};

export const buildPayload = (orderType: OrderType, params: OrderParams) => {
  const { nft, tournament, payload, expectedDstAmount } = params;
  switch (orderType) {
    case OrderType.Swap:
      return {
        expectedDstAmount,
        actualDstAmount: null,
      };
    case OrderType.MintNFT:
      if (nft?.type === NftType.ERC1155) {
        return {
          contractAddress: normalizeAddress(nft.contractAddress),
          nftPrice: nft?.price || "",
          tokenId: nft?.tokenId!,
          contractType: nft?.type,
        };
      } else if (nft?.type === NftType.ERC721) {
        return {
          contractAddress: normalizeAddress(nft.contractAddress),
          nftPrice: nft?.price || "",
          contractType: nft?.type,
        };
      } else {
        throw new Error(`Invalid nft payload: ${JSON.stringify(nft)}`);
      }
    case OrderType.JoinTournament:
      return {
        contractAddress: tournament?.contractAddress,
        entryPrice: tournament?.entryPriceOrFundAmount,
      };
    case OrderType.FundTournament:
      return {
        contractAddress: tournament?.contractAddress,
        fundAmount: tournament?.entryPriceOrFundAmount,
      };
    case OrderType.Custom:
      return { ...payload };
    default:
      throw new Error(`Invalid order type: ${orderType}`);
  }
};

export const buildMetadata = (orderType: OrderType, params: OrderParams) => {
  const { srcToken, dstToken, nft, tournament, payload } = params;
  const baseMetadata = {
    srcToken,
    dstToken,
  };
  switch (orderType) {
    case OrderType.Swap:
      return { ...baseMetadata };
    case OrderType.MintNFT:
      return { ...baseMetadata, nft };
    case OrderType.JoinTournament:
    case OrderType.FundTournament:
      return { ...baseMetadata, tournament };
    case OrderType.Custom:
      return { ...baseMetadata, action: payload.action };
    default:
      throw new Error(`Invalid order type: ${orderType}`);
  }
};
