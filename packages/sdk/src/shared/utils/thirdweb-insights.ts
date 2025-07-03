import { defineChain } from "thirdweb";
import { getWalletBalance } from "thirdweb/wallets";
import { supportedChainNetworks } from "../constants/chains/supported";
import { client } from "./thirdweb";

// Types for Thirdweb Insights API responses
export interface TokenData {
  chain_id?: number;
  token_address?: string;
  contract_address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  balance?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  animation_url?: string;
  background_color?: string;
  external_url?: string;
  status?: string;
  owner_addresses?: string[];
  token_id?: string;
  collection?: {
    name?: string;
    description?: string;
    image_url?: string;
    banner_image_url?: string;
    featured_image_url?: string;
    external_link?: string;
    extra_metadata?: {
      image_original_url?: string;
      [key: string]: any;
    };
  };
  contract?: {
    type?: "ERC20" | "ERC721" | "ERC1155" | "erc20" | "erc721" | "erc1155";
    name?: string;
    symbol?: string;
  };
  extra_metadata?: {
    image_original_url?: string;
    metadata_original_url?: string;
    attributes?: Array<{
      trait_type?: string;
      value?: string | number;
      display_type?: string;
    }>;
    properties?: Record<string, any>;
    [key: string]: any;
  };
  metadata_url?: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    [key: string]: any;
  };
}

export interface TokenBalancesResponse {
  data: TokenData[];
  continuation?: string;
}

export interface TokenBalancesOptions {
  chainIds?: number[];
  tokenType?: "erc20" | "erc721" | "erc1155";
  limit?: number;
  continuation?: string;
  metadata?: boolean;
  page?: number;
  includeSpam?: boolean;
}

// Interface for NFTs by contract response
export interface NFTsByContractResponse {
  data: TokenData[];
  meta: {
    chain_id: number;
    address: string;
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

// Options for fetching NFTs by contract
export interface NFTsByContractOptions {
  limit?: number;
  page?: number;
}

export interface FungibleAssetByContractOptions {
  limit?: number;
  page?: number;
  fungibleId?: string;
}

const INSIGHTS_BASE_URL = "https://insight.thirdweb.com/v1";

export async function getTokenBalances(
  ownerAddress: string,
  options: TokenBalancesOptions = {}
): Promise<TokenBalancesResponse> {
  const { chainIds, tokenType, limit = 100, continuation, metadata = true, page = 0, includeSpam = false } = options;

  const queryParams = new URLSearchParams();

  // Add chain parameters for each chainId
  if (chainIds?.length) {
    chainIds.forEach(chainId => {
      queryParams.append("chain", chainId.toString());
    });
  }

  if (limit !== undefined) {
    queryParams.append("limit", limit.toString());
  }
  if (continuation !== undefined) {
    queryParams.append("continuation", continuation);
  }
  if (metadata !== undefined) {
    queryParams.append("metadata", metadata.toString());
  }
  if (page !== undefined) {
    queryParams.append("page", page.toString());
  }
  if (includeSpam !== undefined) {
    queryParams.append("include_spam", includeSpam.toString());
  }
  // Add clientId to query parameters
  if (client.clientId !== undefined) {
    queryParams.append("clientId", client.clientId);
  }

  // Construct the endpoint based on token type
  let endpoint: string;
  if (tokenType) {
    endpoint = `/tokens/${tokenType}/${ownerAddress}`;
  } else {
    endpoint = `/tokens/${ownerAddress}`;
  }

  const url = `${INSIGHTS_BASE_URL}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      ...(client.clientId ? { "x-client-id": client.clientId } : {}),
      ...(client.secretKey ? { "x-secret-key": client.secretKey } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch token balances: ${response.statusText}`);
  }

  return response.json();
}

// Function to get ERC20 token balances
export async function getERC20Balances(
  ownerAddress: string,
  options: Omit<TokenBalancesOptions, "tokenType"> = {}
): Promise<TokenBalancesResponse> {
  return getTokenBalances(ownerAddress, { ...options, tokenType: "erc20" });
}

// Function to get NFT balances (ERC721 and ERC1155)
export async function getNFTBalances(
  ownerAddress: string,
  options: Omit<TokenBalancesOptions, "tokenType"> = {}
): Promise<TokenBalancesResponse> {
  const erc721Response = await getTokenBalances(ownerAddress, {
    ...options,
    tokenType: "erc721"
  });
  const erc1155Response = await getTokenBalances(ownerAddress, {
    ...options,
    tokenType: "erc1155"
  });

  return {
    data: [...erc721Response.data, ...erc1155Response.data],
    continuation: erc1155Response.continuation
  };
}

/**
 * Fetches NFTs for a specific contract address
 * @param chainId The chain ID where the contract is deployed
 * @param contractAddress The NFT contract address
 * @param options Additional options for the request
 * @returns NFT data for the specified contract
 */
export async function getNFTsByContract(
  chainId: number,
  contractAddress: string,
  options: NFTsByContractOptions = {}
): Promise<NFTsByContractResponse> {
  const { limit = 20, page = 0 } = options;

  const queryParams = new URLSearchParams();

  queryParams.append("chain", chainId.toString());

  if (limit) {
    queryParams.append("limit", limit.toString());
  }
  if (page !== undefined) {
    queryParams.append("page", page.toString());
  }
  // Add clientId to query parameters
  if (client.clientId) {
    queryParams.append("clientId", client.clientId);
  }

  const endpoint = `/nfts/${contractAddress}/1`;
  const url = `${INSIGHTS_BASE_URL}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      ...(client.clientId ? { "x-client-id": client.clientId } : {}),
      ...(client.secretKey ? { "x-secret-key": client.secretKey } : {}),
      "x-chain-id": chainId.toString()
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NFTs by contract: ${response.statusText}`);
  }

  return response.json();
}

// This function replaces the simplehash fungible/assets function just in one place - EditGameTOken
//  I'm not sure if that's the best way to do it, maybe wait for thirdweb to provide a multi id endpoint
export async function getFungibleAssetByContract(
  chainId: number,
  contractAddress: string,
  options: FungibleAssetByContractOptions = {}
): Promise<TokenData> {
  const { limit = 20, page = 0, fungibleId = 0 } = options;

  const queryParams = new URLSearchParams();

  queryParams.append("chain", chainId.toString());

  if (limit) {
    queryParams.append("limit", limit.toString());
  }
  if (page !== undefined) {
    queryParams.append("page", page.toString());
  }
  // Add clientId to query parameters
  if (client.clientId) {
    queryParams.append("clientId", client.clientId);
  }

  const endpoint = `/nfts/${contractAddress}/${fungibleId}`;
  const url = `${INSIGHTS_BASE_URL}${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      ...(client.clientId ? { "x-client-id": client.clientId } : {}),
      ...(client.secretKey ? { "x-secret-key": client.secretKey } : {}),
      "x-chain-id": chainId.toString()
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NFTs by contract: ${response.statusText}`);
  }

  const data = await response.json();

  return data.data?.[0] || null;
}

/**
 * Gets native token balance for a specific chain
 * @param address Wallet address
 * @param chainId Chain ID to get native balance for
 * @returns Native token balance data or null if error
 */
export async function getNativeTokenBalance(address: string, chainId: number): Promise<TokenData | null> {
  if (!address) {
    return null;
  }

  try {
    // Find chain info from supported chains
    const chainInfo = supportedChainNetworks.find(chain => chain.id === chainId);

    // Create a chain object from the chainId
    const chain = defineChain({
      id: chainId,
      name: chainInfo?.name || `Chain ${chainId}`,
      rpc: "",
      nativeCurrency: {
        name: chainInfo?.nativeCurrency?.name || "Native Currency",
        symbol: chainInfo?.nativeCurrency?.symbol || "ETH",
        decimals: chainInfo?.nativeCurrency?.decimals || 18
      }
    });

    // Get native token balance
    const balance = await getWalletBalance({
      address,
      client,
      chain
    });

    // Format to match TokenData structure
    return {
      chain_id: chainId,
      token_address: "0x0000000000000000000000000000000000000000",
      contract_address: "0x0000000000000000000000000000000000000000",
      name: balance.name,
      symbol: balance.symbol,
      decimals: balance.decimals,
      balance: balance.value.toString(),
      metadata: {
        logoURI:
          chainInfo?.icon?.url ||
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"
      },
      // Add native token info in extra_metadata
      extra_metadata: {
        is_native: true
      }
    };
  } catch (error) {
    console.error(`Error fetching native balance for chain ${chainId}:`, error);
    return null;
  }
}
