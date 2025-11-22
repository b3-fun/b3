import { useQuery } from "@tanstack/react-query";

export interface B3ProfileData {
  name: string;
  avatar: string;
}

export function useB3Profile(address?: string) {
  return useQuery({
    queryKey: ["b3-profile", address],
    queryFn: async () => {
      if (!address) {
        throw new Error("Address is required");
      }

      const profileResponse = await fetch(`https://profiles.b3.fun/?address=${address}&fresh=1`);

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await profileResponse.json();

      return {
        name: data.name || data.displayName || "",
        avatar: data.avatar || "",
      } as B3ProfileData;
    },
    enabled: Boolean(address?.startsWith("0x")),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

