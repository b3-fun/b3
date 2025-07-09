import * as SimpleHashTypes from "@b3dotfun/sdk/global-account/types/simplehash.types";
import { CLIENT_APP_BUNDLE_ID, THIRDWEB_CLIENT_ID, THIRDWEB_SECRET_KEY } from "@b3dotfun/sdk/shared/constants";
import {
  getV1Nfts,
  getV1NftsByContractAddress,
  getV1NftsByContractAddressByTokenId,
  getV1NftsTransfersByContractAddress,
} from "@b3dotfun/sdk/shared/thirdweb/generated/sdk.gen";
import { transformCollectionResponse, transformNFTResponse, transformTransferResponse } from "./insights";
export * from "@b3dotfun/sdk/global-account/types/simplehash.types";

export const simpleHashChainToChainId = (chain: string) => {
  switch (chain) {
    case "b3":
      return 8333;
    case "b3-sepolia":
      return 1993;
    case "base":
      return 8453;
    case "base-sepolia":
      return 84532;
    default:
      return null;
  }
};

export const simpleHashChainToChainName = (chain: number) => {
  switch (chain) {
    case 8333:
      return "b3";
    case 1993:
      return "b3-sepolia";
    case 8453:
      return "base";
    case 84532:
      return "base-sepolia";
    default:
      return null;
  }
};

type SimpleHashRoute =
  | `/v0/nfts/${string}/${string}/${string}`
  | `/v0/nfts/${string}`
  | `/v0/nfts/collections/${string}/${string}`
  | `/v0/nfts/transfers/${string}/${string}`
  | `/v0/fungibles/assets`
  | `/v0/native_tokens/balances`
  | string;

type RouteReturnType<T extends SimpleHashRoute> = T extends `/v0/nfts/collections/${string}/${string}` // handled now by Reservoir
  ? SimpleHashTypes.SimpleHashNFTResponse
  : T extends `/v0/nfts/transfers/${string}/${string}` // handled now by ThirdWeb Insights
    ? { transfers: SimpleHashTypes.NFTTransfer[] }
    : T extends `/v0/nfts/${string}/${string}/${string}` // handled now by ThirdWeb Insights
      ? SimpleHashTypes.NFT
      : T extends `/v0/nfts/${string}` // handled now by ThirdWeb Insights
        ? SimpleHashTypes.SimpleHashNFTResponse
        : T extends `/v0/fungibles/assets`
          ? SimpleHashTypes.SimpleHashFungibleResponse
          : T extends `/v0/native_tokens/balances`
            ? SimpleHashTypes.NativeTokenResponse
            : SimpleHashTypes.SimpleHashNFTResponse;

const isServer = typeof window === "undefined";

export async function fetchSimpleHashData<T extends SimpleHashRoute>(
  route: T,
  params: Record<string, any> = {},
  fetchOptions?: RequestInit,
): Promise<RouteReturnType<T>> {
  /**
   * SimpleHash API to ThirdWeb Insights migration
   *
   * Take the approach below to migrate routes from SimpleHash API to ThirdWeb Insights
   * This will allow us to
   */

  // Migrate NFT Owners
  // TODO: This should support multi-wallet, like the original SimpleHash API
  if (route === "/v0/nfts/owners") {
    // Transform query params
    const options = {
      query: {
        chain: params.chains?.split(",").map((chain: string) => simpleHashChainToChainId(chain)),
        owner_address: params.wallet_addresses,
        limit: params.limit || 50,
      },
      headers: {
        "x-secret-key": THIRDWEB_SECRET_KEY,
        "x-client-id": THIRDWEB_CLIENT_ID,
        "x-bundle-id": CLIENT_APP_BUNDLE_ID,
      },
    };

    const response = await getV1Nfts(options);
    if (!response.data) {
      throw new Error("No data returned from ThirdWeb API");
    }

    let transformedResponse = null;

    // Transform response
    try {
      transformedResponse = transformNFTResponse(response.data.data);
    } catch (error) {
      console.error("@@insightsMigrate:error", error);
    }
    return transformedResponse as RouteReturnType<T>;
  }

  // Migrate Collection Data
  if (route.startsWith("/v0/nfts/collections/")) {
    // Extract chain and contract address from route
    const [chain, contractAddress] = route.split("/").slice(-2);

    // Validate chain and contract address
    const chainId = simpleHashChainToChainId(chain);
    if (!chainId || !contractAddress) {
      throw new Error("Invalid chain or contract address");
    }

    try {
      const options = {
        path: {
          contract_address: contractAddress,
        },
        query: {
          chain: [chainId],
        },
      };

      const thirdwebResponse = await getV1NftsByContractAddress(options);
      if (!thirdwebResponse.data?.data?.length) {
        throw new Error("No data returned from ThirdWeb API", { cause: thirdwebResponse.error });
      }

      const transformedResponse = transformCollectionResponse(
        thirdwebResponse.data.data[0],
        chainId,
        chain,
        contractAddress,
      );

      return transformedResponse as RouteReturnType<T>;
    } catch (error) {
      console.error("Failed to fetch collection data:", error);
      throw error;
    }
  }

  // Migrate NFT Transfers
  if (route.startsWith("/v0/nfts/transfers/")) {
    // Extract chain and contract address from route
    const [chain, contractAddress] = route.split("/").slice(-2);

    // Validate chain and contract address
    const chainId = simpleHashChainToChainId(chain);
    if (!chainId || !contractAddress) {
      throw new Error("Invalid chain or contract address");
    }

    try {
      const options = {
        path: {
          contract_address: contractAddress,
        },
        query: {
          chain: [chainId],
          limit: params.limit ? parseInt(params.limit) : 50,
          metadata: params.include_nft_details === "1" ? ("true" as const) : ("false" as const),
          sort_by: "block_timestamp",
          sort_order: params.order_by?.includes("desc") ? "desc" : "asc",
          page: params.page ? parseInt(params.page) : undefined,
        },
      };

      const response = await getV1NftsTransfersByContractAddress(options);
      if (!response.data?.data) {
        throw new Error("No data returned from ThirdWeb API");
      }

      return {
        transfers: transformTransferResponse(response.data),
      } as RouteReturnType<T>;
    } catch (error) {
      console.error("Failed to fetch transfer data:", error);
      throw error;
    }
  }

  // Migrate NFT Details
  if (route.match(/^\/v0\/nfts\/[^/]+\/[^/]+\/[^/]+$/)) {
    // Extract chain, contract address, and token ID from route
    const [chain, contractAddress, tokenId] = route.split("/").slice(-3);

    // Validate chain and contract address
    const chainId = simpleHashChainToChainId(chain);
    if (!chainId || !contractAddress || !tokenId) {
      throw new Error("Invalid chain, contract address, or token ID");
    }

    try {
      const options = {
        path: {
          contract_address: contractAddress,
          token_id: tokenId,
        },
        query: {
          chain: [chainId],
          include_owners: "true" as const,
          resolve_metadata_links: "true" as const,
        },
      };

      const response = await getV1NftsByContractAddressByTokenId(options);
      if (!response.data?.data?.[0]) {
        throw new Error("No data returned from ThirdWeb API");
      }

      const transformedResponse = transformNFTResponse([
        {
          ...response.data.data[0],
          // Needed, because Thirdweb doesn't return the token_id in the response
          token_id: tokenId,
        },
      ]);

      if (!transformedResponse.nfts?.[0]) {
        throw new Error("Failed to transform NFT data");
      }

      return transformedResponse.nfts[0] as RouteReturnType<T>;
    } catch (error) {
      console.error("Failed to fetch NFT details:", error);
      throw error;
    }
  }

  /**
   * From here below is the original SimpleHash API code
   */

  let url: string;
  let options: RequestInit;

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null),
  );

  if ((isServer || process.env.NEXT_PUBLIC_SERVICE === "backend") && process.env.SIMPLEHASH_API_KEY) {
    // Server-side request - direct to SimpleHash API
    url = `https://api.simplehash.com/api${route}`;
    const queryParams = new URLSearchParams(cleanParams);
    url += `?${queryParams.toString()}`;
    options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-KEY": process.env.SIMPLEHASH_API_KEY,
      },
    };
  } else {
    // Client-side request - use proxy
    url = `https://simplehash.basement.fun?route=${encodeURIComponent(route)}`;

    // Append query params
    Object.keys(cleanParams).forEach(key => {
      const value = encodeURIComponent(cleanParams[key]);
      url += `&${key}=${value}`;
    });

    const devmodeSharedSecret =
      process.env.NEXT_PUBLIC_DEVMODE_SHARED_SECRET || process.env.EXPO_PUBLIC_DEVMODE_SHARED_SECRET;
    // Add devmode shared secret if available
    if (devmodeSharedSecret) {
      url += `&localkey=${encodeURIComponent(devmodeSharedSecret)}`;
    }
    options = {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    };
  }

  try {
    const optionsWithNextOptions = { ...options, ...fetchOptions };
    const response = await fetch(url, optionsWithNextOptions);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${route} ${response.status} - ${JSON.stringify(errorData)}`);
    }
    const data = await response.json();

    return data as RouteReturnType<T>;
  } catch (err) {
    console.error(`Failed to fetch SimpleHash data: ${route}`, err);

    if (err instanceof Error && err.message.includes("HTTP error!")) {
      // Error response was already logged above
      throw err;
    }

    // For other errors like network issues
    console.log("error", err);
    throw err;
  }
}

export async function fetchFungibleAssets(
  fungibleIds: string[],
  includePrices: boolean = true,
): Promise<SimpleHashTypes.FungibleAsset | SimpleHashTypes.FungibleAsset[]> {
  const route = "/v0/fungibles/assets";
  const params = {
    fungible_ids: fungibleIds.join(","),
    include_prices: includePrices ? "1" : "0",
  };

  const response = await fetchSimpleHashData(route, params);

  if ("fungibles" in response && Array.isArray(response.fungibles)) {
    return response.fungibles;
  } else {
    return response as SimpleHashTypes.FungibleAsset;
  }
}

export async function fetchNativeTokenBalances(
  chains: string[],
  walletAddresses: string[],
): Promise<SimpleHashTypes.NativeTokenBalance[]> {
  // Input validation
  if (!chains?.length || !walletAddresses?.length) {
    throw new Error("Both chains and walletAddresses arrays must be non-empty");
  }

  if (!chains.every(chain => typeof chain === "string") || !walletAddresses.every(addr => typeof addr === "string")) {
    throw new Error("All chains and wallet addresses must be strings");
  }

  const route = "/v0/native_tokens/balances";
  const params = {
    chains: chains.join(","),
    wallet_addresses: walletAddresses.join(","),
  };

  try {
    const response = await fetchSimpleHashData<"/v0/native_tokens/balances">(route, params);

    if (!response?.native_tokens) {
      throw new Error("Invalid response format: missing native_tokens field");
    }

    return response.native_tokens;
  } catch (error) {
    console.error("Failed to fetch native token balances:", {
      error,
      chains,
      walletAddresses,
    });

    // Rethrow with more context
    if (error instanceof Error) {
      throw new Error(`SimpleHash native token balance fetch failed: ${error.message}`);
    }
    throw error;
  }
}

export default fetchSimpleHashData;
