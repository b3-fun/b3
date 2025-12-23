import type { NFT, SimpleHashNFTResponse } from "@b3dotfun/sdk/global-account/types/simplehash.types";
import { useQuery } from "@tanstack/react-query";
import { buildSimduneUrl } from "../utils/simdune";

/**
 * Safely parse a balance string to a number, capping at MAX_SAFE_INTEGER
 * to prevent overflow issues with large ERC1155 balances.
 */
function safeParseBalance(balance: string | undefined): number {
  if (!balance) return 1;
  const parsed = parseInt(balance, 10);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(parsed, Number.MAX_SAFE_INTEGER);
}

// Simdune Collectibles types
export interface SimCollectibleMetadata {
  uri: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
    display_type?: string | null;
  }>;
}

export interface SimCollectibleEntry {
  contract_address: string;
  token_standard: "ERC721" | "ERC1155";
  token_id: string;
  chain: string;
  chain_id: number;
  name?: string;
  description?: string;
  symbol?: string;
  image_url?: string;
  last_sale_price?: string;
  metadata?: SimCollectibleMetadata;
  is_spam?: boolean;
  spam_score?: number;
  explanations?: string[];
  balance?: string;
  last_acquired?: string;
}

export interface SimCollectiblesResponse {
  address: string;
  entries: SimCollectibleEntry[];
  next_offset?: string;
  request_time: string;
  response_time: string;
}

async function fetchSimCollectibles(
  address: string,
  chainIdsParam?: number[],
  options?: { limit?: number; filterSpam?: boolean },
): Promise<SimCollectiblesResponse> {
  if (!address) throw new Error("Address is required");

  const queryParams = new URLSearchParams();
  if (chainIdsParam && chainIdsParam.length > 0) {
    queryParams.append("chain_ids", chainIdsParam.join(","));
  }
  if (options?.limit) {
    queryParams.append("limit", options.limit.toString());
  }
  if (options?.filterSpam !== undefined) {
    queryParams.append("filter_spam", options.filterSpam.toString());
  }

  const url = buildSimduneUrl(`/v1/evm/collectibles/${address}`, queryParams);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch collectibles: ${response.statusText}`);
  }

  const data: SimCollectiblesResponse = await response.json();
  return data;
}

/**
 * Transforms Simdune collectibles response to SimpleHash NFT format
 * for compatibility with existing AccountAssets component
 */
function transformToSimpleHashFormat(data: SimCollectiblesResponse): SimpleHashNFTResponse {
  const nfts: NFT[] = data.entries.map(entry => ({
    nft_id: `${entry.chain}.${entry.contract_address}.${entry.token_id}`,
    chain: entry.chain,
    contract_address: entry.contract_address,
    token_id: entry.token_id,
    name: entry.name || "",
    description: entry.description || "",
    previews: {
      image_small_url: entry.image_url || "",
      image_medium_url: entry.image_url || "",
      image_large_url: entry.image_url || "",
      image_opengraph_url: entry.image_url || "",
      blurhash: "",
      predominant_color: "",
    },
    image_url: entry.image_url || "",
    image_properties: {
      width: 0,
      height: 0,
      size: 0,
      mime_type: "",
      exif_orientation: null,
    },
    video_url: null,
    video_properties: null,
    audio_url: null,
    audio_properties: null,
    model_url: null,
    model_properties: null,
    other_url: null,
    other_properties: null,
    background_color: null,
    external_url: null,
    created_date: "",
    status: "minted",
    token_count: 1,
    owner_count: 1,
    owners: [
      {
        owner_address: data.address,
        quantity: safeParseBalance(entry.balance),
        quantity_string: entry.balance || "1",
        first_acquired_date: entry.last_acquired || "",
        last_acquired_date: entry.last_acquired || "",
      },
    ],
    contract: {
      type: entry.token_standard,
      name: entry.name || "",
      symbol: entry.symbol || null,
      deployed_by: "",
      deployed_via_contract: "",
      owned_by: "",
      has_multiple_collections: false,
    },
    collection: {
      collection_id: entry.contract_address,
      name: entry.name || "Unknown Collection",
      description: null,
      image_url: entry.image_url || "",
      image_properties: {
        width: 0,
        height: 0,
        mime_type: "",
      },
      banner_image_url: null,
      category: null,
      is_nsfw: null,
      external_url: null,
      twitter_username: null,
      discord_url: null,
      instagram_username: null,
      medium_username: null,
      telegram_url: null,
      marketplace_pages: [],
      metaplex_mint: null,
      metaplex_candy_machine: null,
      metaplex_first_verified_creator: null,
      floor_prices: [],
      top_bids: [],
      distinct_owner_count: 0,
      distinct_nft_count: 0,
      total_quantity: 0,
      chains: [entry.chain],
      top_contracts: [entry.contract_address],
      collection_royalties: [],
    },
    last_sale: entry.last_sale_price
      ? {
          price: entry.last_sale_price,
        }
      : null,
    primary_sale: null,
    first_created: {
      minted_to: data.address,
      quantity: 1,
      quantity_string: "1",
      timestamp: "",
      block_number: 0,
      transaction: "",
      transaction_initiator: "",
    },
    rarity: {
      rank: null,
      score: null,
      unique_attributes: null,
    },
    royalty: [],
    extra_metadata: {
      attributes: (entry.metadata?.attributes || []).map(attr => ({
        trait_type: attr.trait_type,
        value: attr.value,
        display_type: attr.display_type ?? null,
      })),
      image_original_url: entry.image_url || "",
      animation_original_url: null,
      metadata_original_url: entry.metadata?.uri || "",
    },
  }));

  return {
    next_cursor: data.next_offset || null,
    next: null,
    previous: null,
    nfts,
  };
}

/**
 * Hook to fetch NFT collectibles from Simdune API.
 * Returns data in SimpleHash format for compatibility with AccountAssets component.
 * @param address - Wallet address to fetch collectibles for
 * @param chainIdsParam - Optional array of chain IDs to filter by
 * @param options - Optional parameters (limit, filterSpam)
 */
export function useSimCollectibles(
  address?: string,
  chainIdsParam?: number[],
  options?: { limit?: number; filterSpam?: boolean },
) {
  return useQuery({
    queryKey: ["simCollectibles", address, chainIdsParam, options],
    queryFn: async () => {
      if (!address) throw new Error("Address is required");
      const data = await fetchSimCollectibles(address, chainIdsParam, options);
      return transformToSimpleHashFormat(data);
    },
    enabled: Boolean(address),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
