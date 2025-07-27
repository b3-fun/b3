import { useQuery } from "@tanstack/react-query";

// TypeScript interface for profile data
export interface Profile {
  type: string;
  address?: string;
  name?: string;
  avatar?: string | null;
  bio?: string | null;
  displayName?: string | null;
}

export interface CombinedProfile {
  name: string | null;
  address: string | null;
  avatar: string | null;
  bio: string | null;
  displayName: string | null;
  profiles: Profile[];
}

// TypeScript interface for preference request body
export interface PreferenceRequestBody {
  key: string;
  preferredType: string;
  signature: string;
  signer: string;
  timestamp: number;
}

const PROFILES_API_URL = "https://profiles.b3.fun";

async function fetchProfile({
  address,
  name,
  fresh = false,
}: {
  address?: string;
  name?: string;
  fresh?: boolean;
}): Promise<CombinedProfile> {
  if (!address && !name) {
    throw new Error("Either address or name must be provided");
  }

  const params = new URLSearchParams();
  if (address) params.append("address", address);
  if (name) params.append("name", name);
  if (fresh) params.append("fresh", "true");

  const response = await fetch(`${PROFILES_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

async function setProfilePreference({
  key,
  preferredType,
  signature,
  signer,
  timestamp,
}: PreferenceRequestBody): Promise<{ success: boolean }> {
  const response = await fetch(`${PROFILES_API_URL}/preference`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      preferredType,
      signature,
      signer,
      timestamp,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to set preference: ${response.statusText}`);
  }

  return response.json();
}

export function useProfile(
  {
    address,
    name,
    fresh = false,
  }: {
    address?: string;
    name?: string;
    fresh?: boolean;
  },
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  },
) {
  return useQuery({
    queryKey: ["profile", address || name, fresh],
    queryFn: () => fetchProfile({ address, name, fresh }),
    enabled: (options?.enabled ?? true) && (!!address || !!name),
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
  });
}

export function useProfilePreference() {
  const setPreference = async (
    key: string,
    preferredType: string,
    signerAddress: string,
    signMessage: (message: string) => Promise<string>,
  ) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `SetProfilePreference:${key}:${preferredType}:${timestamp}`;

    try {
      const signature = await signMessage(message);

      return setProfilePreference({
        key,
        preferredType,
        signature,
        signer: signerAddress,
        timestamp,
      });
    } catch (error) {
      throw new Error(`Failed to set profile preference: ${error}`);
    }
  };

  return { setPreference };
}

export default useProfile;
