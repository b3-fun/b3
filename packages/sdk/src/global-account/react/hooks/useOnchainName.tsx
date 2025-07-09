"use client";

import { getB3NameByAddress, getEnsName } from "@b3dotfun/sdk/shared/utils/b3Ens";
import { fetchBsmntProfile } from "@b3dotfun/sdk/shared/utils/fetchBsmntProfile";
import { useQueries, useQuery } from "@tanstack/react-query";

export function useOnchainName(address: string | undefined) {
  const { data: bsmntName, isLoading: isLoadingBsmnt } = useQuery({
    queryKey: ["useOnchainName/bsmntName", address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;
      try {
        const response = await fetchBsmntProfile(undefined, address);
        return response?.username?.replaceAll(".b3.fun", "") || null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!address,
  });

  const { data: b3Name, isLoading: isLoadingB3 } = useQuery({
    queryKey: ["b3-name", address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;
      try {
        const response = await getB3NameByAddress(address);
        return response?.name?.replaceAll(".b3.fun", "") || null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!address,
  });

  const { data: ensName, isLoading: isLoadingEns } = useQuery({
    queryKey: ["ens-name", address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;
      try {
        const corsProxyUrl =
          "https://proxy.basement.fun/?url=" + encodeURIComponent(`https://api.ensdata.net/${address}`);
        const response = await fetch(corsProxyUrl);
        const data = await response.json();
        return data?.ens || null;
      } catch (error) {
        console.error("Error fetching ENS name:", error);
        return null;
      }
    },
    enabled: !!address,
  });

  return {
    name: bsmntName || b3Name || ensName || null,
    isLoading: isLoadingBsmnt || isLoadingB3 || isLoadingEns,
    b3Name,
    ensName,
  };
}

export function useOnchainNames(addresses: string[]) {
  const queries = addresses.map(address => ({
    queryKey: ["onchain-name", address.toLowerCase()],
    queryFn: async () => {
      try {
        // Try B3 name first
        const b3Response = await getB3NameByAddress(address);
        if (b3Response?.name) {
          return b3Response.name;
        }

        // Fall back to ENS
        const corsProxyUrl =
          "https://proxy.basement.fun/?url=" + encodeURIComponent(`https://api.ensdata.net/${address}`);
        const ensResponse = await fetch(corsProxyUrl);
        const ensData = await ensResponse.json();
        return ensData?.ens || null;
      } catch (error) {
        console.error("Error fetching onchain name:", error);
        return null;
      }
    },
    enabled: !!address,
  }));

  const results = useQueries({ queries });

  return {
    names: results.map(result => result.data),
    isLoading: results.some(result => result.isLoading),
  };
}

// Add a new hook to resolve ENS/B3 names to addresses
export function useResolveOnchainName(name: string | undefined) {
  const { data: address, isLoading } = useQuery({
    queryKey: ["name-resolve", name?.toLowerCase()],
    queryFn: async () => {
      if (!name) return null;
      try {
        const isB3Name = name.startsWith("@") || name.toLowerCase().endsWith(".b3");

        if (isB3Name) {
          // If contains and @, remove @ and add .b3.fun
          if (name.includes("@")) {
            name = name.replace("@", "").replace(".b3.fun", "") + ".b3.fun";
          }

          // Try B3 name resolution first
          try {
            const b3Response = await getEnsName(name);
            const b3Data = await b3Response.json();
            if (b3Data?.addresses?.["60"]) {
              return b3Data.addresses["60"];
            }
          } catch (error) {}

          // Fall back to ENS only if it's a .b3 name (not @)
          if (!name.startsWith("@")) {
            const corsProxyUrl =
              "https://proxy.basement.fun/?url=" + encodeURIComponent(`https://api.ensdata.net/${name}`);
            const ensResponse = await fetch(corsProxyUrl);
            const ensData = await ensResponse.json();
            return ensData?.address || null;
          }
          return null;
        } else {
          // Try ENS resolution first
          const corsProxyUrl =
            "https://proxy.basement.fun/?url=" + encodeURIComponent(`https://api.ensdata.net/${name}`);
          const ensResponse = await fetch(corsProxyUrl);
          const ensData = await ensResponse.json();
          if (ensData?.address) {
            return ensData.address;
          }

          // Fall back to B3 name resolution
          try {
            const b3Response = await getEnsName(
              name.replace("@", "").replace(".b3.fun", "").replace(".b3", "") + ".b3.fun",
            );
            const b3Data = await b3Response.json();
            return b3Data?.addresses?.["60"] || null;
          } catch (error) {
            return null;
          }
        }
      } catch (error) {
        console.error("Error resolving name:", error);
        return null;
      }
    },
    enabled: !!name,
  });

  return {
    address,
    isLoading,
  };
}

// Add a new hook to fetch ENS profile image
export function useOnchainPFP(name: string | undefined) {
  const { address } = useResolveOnchainName(name);

  const { data: pfp, isLoading } = useQuery({
    queryKey: ["ens-pfp", name?.toLowerCase()],
    queryFn: async () => {
      if (!name) return null;
      try {
        // First try ENS avatar
        const corsProxyUrl = "https://proxy.basement.fun/?url=" + encodeURIComponent(`https://api.ensdata.net/${name}`);
        const response = await fetch(corsProxyUrl);
        const data = await response.json();

        if (data?.avatar) {
          // If it's an IPFS URL, convert it to a gateway URL
          if (data.avatar.startsWith("ipfs://")) {
            return data.avatar.replace("ipfs://", "https://ipfs.io/ipfs/");
          }
          return data.avatar;
        }
        return null;
      } catch (error) {
        console.error("Error fetching ENS PFP:", error);
        return null;
      }
    },
    enabled: !!name,
  });

  return {
    pfp,
    isLoading,
    address,
  };
}
