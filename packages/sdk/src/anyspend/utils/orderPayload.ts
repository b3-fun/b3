import { normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

export type OrderParams = {
  orderType: components["schemas"]["Order"]["type"];
  srcToken: components["schemas"]["Token"];
  dstToken: components["schemas"]["Token"];
  expectedDstAmount?: string;
  nft?: components["schemas"]["NFT"] & { price: string };
  tournament?: components["schemas"]["Tournament"] & { contractAddress: string; entryPriceOrFundAmount: string };
  payload?: any;
};

export const buildPayload = (orderType: components["schemas"]["Order"]["type"], params: OrderParams) => {
  const { nft, tournament, payload, expectedDstAmount } = params;
  switch (orderType) {
    case "swap":
      return {
        expectedDstAmount,
        actualDstAmount: null,
      };
    case "mint_nft":
      if (nft?.type === "erc1155") {
        return {
          contractAddress: normalizeAddress(nft.contractAddress),
          nftPrice: nft?.price || "",
          tokenId: nft.tokenId,
          contractType: nft?.type,
        };
      } else if (nft?.type === "erc721") {
        return {
          contractAddress: normalizeAddress(nft.contractAddress),
          nftPrice: nft?.price || "",
          contractType: nft?.type,
        };
      } else {
        throw new Error(`Invalid nft payload: ${JSON.stringify(nft)}`);
      }
    case "join_tournament":
      return {
        contractAddress: tournament?.contractAddress,
        entryPrice: tournament?.entryPriceOrFundAmount,
      };
    case "fund_tournament":
      return {
        contractAddress: tournament?.contractAddress,
        fundAmount: tournament?.entryPriceOrFundAmount,
      };
    case "custom":
      return { ...payload };
    case "hype_duel":
      return {
        expectedDstAmount,
        actualDstAmount: null,
      };
    default:
      throw new Error(`Invalid order type: ${orderType}`);
  }
};

export const buildMetadata = (orderType: components["schemas"]["Order"]["type"], params: OrderParams) => {
  const { srcToken, dstToken, nft, tournament, payload } = params;
  const baseMetadata = {
    srcToken,
    dstToken,
  };
  switch (orderType) {
    case "swap":
      return { ...baseMetadata };
    case "mint_nft":
      return { ...baseMetadata, nft };
    case "join_tournament":
    case "fund_tournament":
      return { ...baseMetadata, tournament };
    case "custom":
      return { ...baseMetadata, action: payload.action };
    case "hype_duel":
      return { ...baseMetadata };
    default:
      throw new Error(`Invalid order type: ${orderType}`);
  }
};
