import { THIRDWEB_CLIENT_ID } from "@b3dotfun/sdk/shared/constants";
import { useQuery } from "@tanstack/react-query";
import createDebug from "debug";

const debug = createDebug("@@b3:useTokensFromAddress");

// TODO: Migrate to the OpenAPI spec
interface TokenAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

interface TokenCollection {
  name?: string;
  description?: string;
  image_url?: string;
  banner_image_url?: string;
  featured_image_url?: string;
  external_link?: string;
}

interface TokenContract {
  name?: string;
  symbol?: string;
  type?: "erc721" | "erc1155";
}

export interface Token {
  chainId: number; // deprecated
  chain_id: number;
  tokenAddress: string; // deprecated
  token_address: string;
  tokenId: string; // deprecated
  token_id: string;
  balance: string;
  name?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  animation_url?: string;
  background_color?: string;
  external_url?: string;
  status?: string;
  owner_addresses?: string[];
  extra_metadata?: {
    attributes?: TokenAttribute[] | Record<string, any>;
    properties?: Record<string, any>;
  };
  collection?: TokenCollection;
  contract?: TokenContract;
}

export interface TokensResponse {
  data: Token[];
}

interface UseTokensFromAddressProps {
  ownerAddress?: string;
  chain?: number | number[]; // Change to accept number or array of numbers
  limit?: number; // default: 50, max: 100
  page?: number; // default: 0
  metadata?: boolean; // default: false
}

export function useTokensFromAddress({
  ownerAddress,
  chain,
  limit = 50,
  page = 0,
  metadata = true,
}: UseTokensFromAddressProps) {
  return useQuery({
    queryKey: ["useTokensFromAddress", ownerAddress, chain, limit, page, metadata],
    queryFn: async () => {
      if (!ownerAddress) {
        return { data: [] } as TokensResponse;
      }

      const params = new URLSearchParams();

      // Handle chain parameter(s)
      if (chain) {
        if (Array.isArray(chain)) {
          // Add multiple chain parameters
          chain.forEach(chainId => {
            params.append("chain", chainId.toString());
          });
        } else {
          // Add single chain parameter
          params.append("chain", chain.toString());
        }
      }

      if (limit) params.append("limit", limit.toString());
      if (page) params.append("page", page.toString());
      if (metadata) params.append("metadata", metadata.toString());
      params.append("clientId", THIRDWEB_CLIENT_ID);

      const queryString = params.toString();
      const url = `https://insight.thirdweb.com/v1/tokens/erc1155/${ownerAddress}${
        queryString ? `?${queryString}` : ""
      }`;

      debug("Fetching tokens:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }

      const data = await response.json();
      return data as TokensResponse;
    },
    enabled: Boolean(ownerAddress),
  });
}
