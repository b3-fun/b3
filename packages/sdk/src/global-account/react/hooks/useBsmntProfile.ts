import { fetchBsmntProfile } from "@b3dotfun/sdk/shared/utils/fetchBsmntProfile";
import { useQuery } from "@tanstack/react-query";

export interface UseProfileOptions {
  address?: string;
}

export const useBsmntProfile = ({ address }: UseProfileOptions) => {
  return useQuery({
    queryKey: ["useBsmntProfile", address],
    queryFn: () => fetchBsmntProfile(undefined, address),
    enabled: !!address,
  });
};
