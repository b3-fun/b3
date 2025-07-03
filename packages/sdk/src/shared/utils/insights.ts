// Find a better way to initiate this
import "@b3dotfun/sdk/shared/thirdweb/initiateClient";

import type * as SimpleHashTypes from "@b3dotfun/sdk/global-account/types/simplehash.types";
import type {
  GetV1NftsResponse,
  GetV1NftsTransfersByContractAddressResponse
} from "@b3dotfun/sdk/shared/thirdweb/generated/types.gen";
import { simpleHashChainToChainName as getSimpleHashChainName } from "@b3dotfun/sdk/shared/utils/simplehash";

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

// Utility to transform Insights NFT data to SimpleHash format
export function transformNFTResponse(insightsData: GetV1NftsResponse["data"]): SimpleHashTypes.SimpleHashNFTResponse {
  return {
    next_cursor: null,
    next: null,
    previous: null,
    nfts: insightsData.map(nft => {
      const contractAddress = nft.contract?.address || "";
      // Use a safe fallback for owner_addresses
      const ownerAddresses = (nft as any).owner_addresses || [];

      return {
        nft_id: `${nft.chain_id}-${contractAddress}-${nft.token_id}`,
        chain: simpleHashChainToChainName(nft?.chain_id || 8333) || "",
        contract_address: contractAddress,
        token_id: nft.token_id,
        name: nft.name || "",
        description: nft.description || "",
        image_url: nft.image_url || "",
        video_url: nft.video_url || null,
        audio_url: null,
        model_url: null,
        other_url: null,
        background_color: nft.background_color || null,
        external_url: nft.external_url || null,
        created_date: new Date().toISOString(),
        status: nft.status || "",
        token_count: 1,
        owner_count: ownerAddresses.length || 0,
        owners:
          ownerAddresses.map((address: string) => ({
            owner_address: address,
            quantity: 1,
            quantity_string: "1",
            first_acquired_date: new Date().toISOString(),
            last_acquired_date: new Date().toISOString()
          })) || [],
        previews: {
          image_small_url: nft.image_url || "",
          image_medium_url: nft.image_url || "",
          image_large_url: nft.image_url || "",
          image_opengraph_url: nft.image_url || "",
          blurhash: "",
          predominant_color: ""
        },
        image_properties: {
          width: 0,
          height: 0,
          size: 0,
          mime_type: "",
          exif_orientation: null
        },
        video_properties: null,
        audio_properties: null,
        model_properties: null,
        other_properties: null,
        contract: {
          type: nft.contract?.type || "erc721",
          name: nft.contract?.name || "",
          symbol: nft.contract?.symbol || null,
          deployed_by: "",
          deployed_via_contract: "",
          owned_by: "",
          has_multiple_collections: false
        },
        collection: {
          collection_id: contractAddress ? `${nft.chain_id}-${contractAddress}` : "",
          name: nft.collection?.name || "",
          description: nft.collection?.description || null,
          image_url: nft.collection?.image_url || "",
          image_properties: {
            width: 0,
            height: 0,
            mime_type: ""
          },
          banner_image_url: nft.collection?.banner_image_url || null,
          category: null,
          is_nsfw: false,
          external_url: nft.collection?.external_link || null,
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
          chains: [nft.contract?.chain_id?.toString() || ""],
          top_contracts: [nft.contract_address],
          collection_royalties: []
        },
        last_sale: null,
        primary_sale: null,
        first_created: {
          minted_to: ownerAddresses[0] || "",
          quantity: 1,
          quantity_string: "1",
          timestamp: new Date().toISOString(),
          block_number: 0,
          transaction: "",
          transaction_initiator: ""
        },
        rarity: {
          rank: null,
          score: null,
          unique_attributes: null
        },
        royalty: [],
        extra_metadata: {
          attributes: (nft.extra_metadata?.attributes || []) as {
            trait_type: string;
            value: string;
            display_type: string | null;
          }[],
          properties: nft.extra_metadata?.properties || {},
          image_original_url: nft.image_url || "",
          animation_original_url: nft.animation_url || null,
          metadata_original_url: nft.external_url || ""
        }
      };
    })
  };
}

// Utility to transform Insights NFT data to SimpleHash Collection format
export function transformCollectionResponse(
  nftData: GetV1NftsResponse["data"][0],
  chainId: number,
  chain: string,
  contractAddress: string
): SimpleHashTypes.SimpleHashNFTResponse {
  const collectionData: SimpleHashTypes.NFTCollection = {
    collection_id: `${chainId}-${contractAddress}`,
    name: nftData.collection?.name || "",
    description: nftData.collection?.description || "",
    image_url: nftData.collection?.image_url || "",
    image_properties: {
      width: 0,
      height: 0,
      mime_type: ""
    },
    banner_image_url: nftData.collection?.banner_image_url || null,
    category: null,
    is_nsfw: false,
    external_url: nftData.collection?.external_link || null,
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
    // We need this for owners
    distinct_owner_count: 0,
    // We need this for total NFTs
    distinct_nft_count: 0,
    total_quantity: 0,
    chains: [chainId.toString()],
    top_contracts: [contractAddress],
    collection_royalties: [],
    top_contract_details: [
      {
        chain: chain,
        contract_address: contractAddress,
        name: nftData.contract?.name || "",
        type: nftData.contract?.type || "erc721",
        symbol: nftData.contract?.symbol || "",
        distinct_nft_count: 0,
        deployed_by: "",
        deployed_via_contract: "",
        deployment_date: new Date().toISOString(),
        owned_by: "",
        has_multiple_collections: false
      }
    ]
  };

  return {
    next_cursor: null,
    next: null,
    previous: null,
    collections: [collectionData]
  };
}

export function transformTransferResponse(
  response: GetV1NftsTransfersByContractAddressResponse
): SimpleHashTypes.NFTTransfer[] {
  if (!response.data) return [];

  return response.data.map(transfer => ({
    nft_id: `${transfer.contract_address}:${transfer.token_id}`,
    chain: getSimpleHashChainName(transfer.chain_id) || "base",
    contract_address: transfer.contract_address,
    token_id: transfer.token_id,
    collection_id: transfer.contract_address,
    event_type: transfer.transfer_type,
    from_address: transfer.from_address,
    to_address: transfer.to_address,
    quantity: 1,
    quantity_string: "1",
    timestamp: transfer.block_timestamp,
    block_number: parseInt(transfer.block_number),
    block_hash: transfer.block_hash || "",
    transaction: transfer.transaction_hash,
    transaction_index: transfer.log_index,
    transaction_initiator: transfer.from_address,
    transaction_value: 0,
    transaction_fee: 0,
    log_index: transfer.log_index,
    log_transaction_index: 0,
    log_address: transfer.contract_address,
    batch_transfer_index: 0,
    sale_details: undefined,
    nft_details: transfer.nft_metadata
      ? {
          nft_id: `${transfer.contract_address}:${transfer.token_id}`,
          chain: getSimpleHashChainName(transfer.chain_id) || "base",
          contract_address: transfer.contract_address,
          token_id: transfer.token_id,
          name: transfer.nft_metadata.name || "",
          description: transfer.nft_metadata.description || "",
          previews: {
            image_small_url: transfer.nft_metadata.image_url || "",
            image_medium_url: transfer.nft_metadata.image_url || "",
            image_large_url: transfer.nft_metadata.image_url || "",
            image_opengraph_url: transfer.nft_metadata.image_url || "",
            blurhash: "",
            predominant_color: transfer.nft_metadata.background_color || ""
          },
          image_url: transfer.nft_metadata.image_url || "",
          image_properties: {
            width: 0,
            height: 0,
            size: 0,
            mime_type: "",
            exif_orientation: null
          },
          video_url: transfer.nft_metadata.video_url || null,
          video_properties: null,
          audio_url: null,
          audio_properties: null,
          model_url: null,
          model_properties: null,
          other_url: null,
          other_properties: null,
          background_color: transfer.nft_metadata.background_color || null,
          external_url: transfer.nft_metadata.external_url || null,
          created_date: transfer.block_timestamp,
          status: transfer.nft_metadata.status || "",
          token_count: 1,
          owner_count: 1,
          owners: [
            {
              owner_address: transfer.to_address,
              quantity: 1,
              quantity_string: "1",
              first_acquired_date: transfer.block_timestamp,
              last_acquired_date: transfer.block_timestamp
            }
          ],
          extra_metadata: {
            attributes: (transfer.nft_metadata.extra_metadata?.attributes || []) as {
              trait_type: string;
              value: string;
              display_type: string | null;
            }[],
            properties: transfer.nft_metadata.extra_metadata?.properties || {},
            image_original_url: transfer.nft_metadata.image_url || "",
            animation_original_url: transfer.nft_metadata.video_url || null,
            metadata_original_url: transfer.nft_metadata.external_url || ""
          },
          collection: {
            collection_id: transfer.contract_address,
            name: transfer.nft_metadata.collection?.name || "",
            description: transfer.nft_metadata.collection?.description || null,
            image_url: transfer.nft_metadata.collection?.image_url || "",
            image_properties: {
              width: 0,
              height: 0,
              mime_type: ""
            },
            banner_image_url: transfer.nft_metadata.collection?.banner_image_url || null,
            featured_image_url: transfer.nft_metadata.collection?.featured_image_url || null,
            external_link: transfer.nft_metadata.collection?.external_link || null,
            verified: false,
            is_nsfw: false,
            floor_prices: [],
            market_cap: null,
            market_cap_usd: null,
            volume_all_time: null,
            volume_all_time_usd: null,
            volume_24h: null,
            volume_24h_usd: null,
            volume_7d: null,
            volume_7d_usd: null,
            volume_30d: null,
            volume_30d_usd: null,
            total_supply: null,
            num_owners: null,
            average_price_24h: null,
            average_price_24h_usd: null,
            average_price_7d: null,
            average_price_7d_usd: null,
            average_price_30d: null,
            average_price_30d_usd: null,
            collection_royalties: [],
            category: null,
            external_url: null,
            twitter_username: null,
            discord_url: null,
            telegram_url: null,
            instagram_username: null,
            medium_username: null,
            github_username: null,
            website_url: null,
            wiki_url: null,
            blog_url: null,
            forum_url: null,
            chat_url: null,
            discord_members: null,
            telegram_members: null,
            twitter_followers: null,
            instagram_followers: null,
            marketplace_pages: [],
            metaplex_mint: null,
            metaplex_candy_machine: null,
            metaplex_first_verified_creator: null,
            metaplex_verified_creators: [],
            metaplex_primary_sale_happened: false,
            metaplex_is_mutable: false,
            metaplex_freeze_authority: null,
            metaplex_collection: null,
            metaplex_uses: null,
            top_bids: [],
            distinct_owner_count: 0,
            distinct_nft_count: 0,
            total_quantity: 0,
            total_quantity_string: "0",
            total_owners: 0,
            total_nfts: 0,
            chains: [],
            top_contracts: []
          },
          contract: {
            type: transfer.nft_metadata.contract?.type || "erc721",
            name: transfer.nft_metadata.contract?.name || "",
            symbol: transfer.nft_metadata.contract?.symbol || null,
            deployed_by: transfer.contract_address,
            deployed_via_contract: transfer.contract_address,
            owned_by: transfer.to_address,
            has_multiple_collections: false
          },
          last_sale: null,
          primary_sale: null,
          first_created: {
            minted_to: transfer.to_address,
            quantity: 1,
            quantity_string: "1",
            timestamp: transfer.block_timestamp,
            block_number: parseInt(transfer.block_number),
            transaction: transfer.transaction_hash,
            transaction_initiator: transfer.from_address
          },
          rarity: {
            rank: null,
            score: null,
            unique_attributes: null
          },
          royalty: []
        }
      : undefined
  }));
}
