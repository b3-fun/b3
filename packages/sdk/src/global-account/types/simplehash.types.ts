export type SimpleHashNFTResponse = {
  next_cursor: string | null;
  next: string | null;
  previous: string | null;
  nfts?: NFT[];
  collections?: CollectionsByWalletsResponse[] | NFTCollection[];
  transfers?: NFTTransfer[];
};

export type NFT = {
  nft_id: string;
  chain: string;
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  previews: {
    image_small_url: string;
    image_medium_url: string;
    image_large_url: string;
    image_opengraph_url: string;
    blurhash: string;
    predominant_color: string;
  };
  image_url: string;
  image_properties: {
    width: number;
    height: number;
    size: number;
    mime_type: string;
    exif_orientation: string | null;
  };
  video_url: string | null;
  video_properties: any | null;
  audio_url: string | null;
  audio_properties: any | null;
  model_url: string | null;
  model_properties: any | null;
  other_url: string | null;
  other_properties: any | null;
  background_color: string | null;
  external_url: string | null;
  created_date: string;
  status: string;
  token_count: number;
  owner_count: number;
  owners: {
    owner_address: string;
    quantity: number;
    quantity_string: string;
    first_acquired_date: string;
    last_acquired_date: string;
  }[];
  contract: {
    type: string;
    name: string;
    symbol: string | null;
    deployed_by: string;
    deployed_via_contract: string;
    owned_by: string;
    has_multiple_collections: boolean;
  };
  collection: {
    collection_id: string;
    name: string;
    description: string | null;
    image_url: string;
    image_properties: {
      width: number;
      height: number;
      mime_type: string;
    };
    banner_image_url: string | null;
    category: string | null;
    is_nsfw: boolean | null;
    external_url: string | null;
    twitter_username: string | null;
    discord_url: string | null;
    instagram_username: string | null;
    medium_username: string | null;
    telegram_url: string | null;
    marketplace_pages: any[];
    metaplex_mint: string | null;
    metaplex_candy_machine: string | null;
    metaplex_first_verified_creator: string | null;
    floor_prices: any[];
    top_bids: any[];
    distinct_owner_count: number;
    distinct_nft_count: number;
    total_quantity: number;
    chains: string[];
    top_contracts: string[];
    collection_royalties: {
      source: string;
      total_creator_fee_basis_points: number;
      recipients: any[];
    }[];
  };
  last_sale: any | null;
  primary_sale: any | null;
  first_created: {
    minted_to: string;
    quantity: number;
    quantity_string: string;
    timestamp: string;
    block_number: number;
    transaction: string;
    transaction_initiator: string;
  };
  rarity: {
    rank: number | null;
    score: number | null;
    unique_attributes: number | null;
  };
  royalty: {
    source: string;
    total_creator_fee_basis_points: number;
    recipients: any[];
  }[];
  extra_metadata: {
    attributes: {
      trait_type: string;
      value: string;
      display_type: string | null;
    }[];
    properties?: {
      [key: string]: any;
    };
    image_original_url: string;
    animation_original_url: string | null;
    metadata_original_url: string;
  };
};

export type NFTCollection = {
  collection_id: string;
  name: string;
  description: string;
  image_url: string;
  image_properties: {
    width: number;
    height: number;
    mime_type: string;
  };
  banner_image_url: string | null;
  category: string | null;
  is_nsfw: boolean | null;
  external_url: string | null;
  twitter_username: string | null;
  discord_url: string | null;
  instagram_username: string | null;
  medium_username: string | null;
  telegram_url: string | null;
  marketplace_pages: any[];
  metaplex_mint: string | null;
  metaplex_candy_machine: string | null;
  metaplex_first_verified_creator: string | null;
  floor_prices: any[];
  top_bids: any[];
  distinct_owner_count: number;
  distinct_nft_count: number;
  total_quantity: number;
  chains: string[];
  top_contracts: string[];
  collection_royalties: Array<{
    source: string;
    total_creator_fee_basis_points: number;
    recipients: any[];
  }>;
  top_contract_details?: Array<{
    chain: string;
    contract_address: string;
    name: string;
    type: string;
    symbol: string;
    distinct_nft_count: number;
    deployed_by: string;
    deployed_via_contract: string;
    deployment_date: string;
    owned_by: string;
    has_multiple_collections: boolean;
  }>;
};

export type NFTTransfer = {
  nft_id: string;
  chain: string;
  contract_address: string;
  token_id: string;
  collection_id: string;
  event_type: string;
  from_address: string | null;
  to_address: string;
  quantity: number;
  quantity_string: string;
  timestamp: string;
  block_number: number;
  block_hash: string;
  transaction: string;
  transaction_index: number;
  transaction_initiator: string;
  transaction_value: number;
  transaction_fee: number;
  log_index: number;
  batch_transfer_index: number;
  sale_details: any | null;
  nft_details?: NFT | null;
};

export type CollectionsByWalletsResponse = {
  collection_id: string;
  distinct_nfts_owned: number;
  distinct_nfts_owned_string: string;
  total_copies_owned: number;
  total_copies_owned_string: string;
  last_acquired_date: string;
  nft_ids: string[];
  collection_details: NFTCollection;
};

export type FungibleAsset = {
  fungible_id: string;
  name: string;
  symbol: string;
  decimals: number;
  chain: string;
  prices: any[]; // You might want to define a more specific type for prices
  previews: {
    image_small_url: string | null;
    image_medium_url: string | null;
    image_large_url: string | null;
    image_opengraph_url: string | null;
    blurhash: string | null;
    predominant_color: string | null;
  };
  image_url: string | null;
  image_properties: any | null;
  created_date: string | null;
  supply: string | null;
  extra_metadata: Record<string, any>;
  queried_wallet_balances?: Array<{
    address: string;
    quantity: number;
    quantity_string: string;
    value_usd_cents: number;
    value_usd_string: string;
    first_transferred_date: string;
    last_transferred_date: string;
    subaccounts: any[];
  }>;
  total_quantity?: number;
  total_quantity_string?: string;
  fungible_details?: {
    fungible_id: string;
    name: string;
    symbol: string;
    decimals: number;
    chain: string;
    previews: {
      image_small_url: string | null;
      image_medium_url: string | null;
      image_large_url: string | null;
      image_opengraph_url: string | null;
      blurhash: string | null;
      predominant_color: string | null;
    };
    image_url: string | null;
    image_properties: any | null;
    created_date: string | null;
    supply: string | null;
    extra_metadata: Record<string, any>;
  };
};

export type FungibleBalanceResponse = {
  fungibles: FungibleAsset[];
  next_cursor: string | null;
};

export type NativeTokenBalance = {
  token_id: string;
  name: string;
  symbol: string;
  decimals: number;
  chain: string;
  total_quantity: number;
  total_quantity_string: string;
  total_value_usd_cents: number;
  queried_wallet_balances: Array<{
    address: string;
    quantity: number;
    quantity_string: string;
    value_usd_cents: number;
  }>;
};

export type NativeTokenResponse = {
  native_tokens: NativeTokenBalance[];
};

export type SimpleHashFungibleResponse = FungibleBalanceResponse | FungibleAsset;
