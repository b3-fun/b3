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
  avatar: string | undefined;
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

// TypeScript interface for display name request body
export interface DisplayNameRequestBody {
  key: string;
  displayName: string;
  signature: string;
  signer: string;
  timestamp: number;
}

const PROFILES_API_URL = "https://profiles.b3.fun";

async function fetchProfile({
  address,
  name,
  b3GlobalId,
  fresh = false,
}: {
  address?: string;
  name?: string;
  b3GlobalId?: string;
  fresh?: boolean;
}): Promise<CombinedProfile> {
  if (!address && !name && !b3GlobalId) {
    throw new Error("Either address or name or b3GlobalId must be provided");
  }

  const params = new URLSearchParams();
  if (address) params.append("address", address);
  if (name) params.append("name", name);
  if (b3GlobalId) params.append("b3GlobalId", b3GlobalId);
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

async function setDisplayName({
  key,
  displayName,
  signature,
  signer,
  timestamp,
}: DisplayNameRequestBody): Promise<{ success: boolean }> {
  const response = await fetch(`${PROFILES_API_URL}/display-name`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      displayName,
      signature,
      signer,
      timestamp,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to set display name: ${response.statusText}`);
  }

  return response.json();
}

export function useProfile(
  {
    address,
    name,
    b3GlobalId,
    fresh = false,
  }: {
    address?: string;
    name?: string;
    b3GlobalId?: string;
    fresh?: boolean;
  },
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  },
) {
  return useQuery({
    queryKey: ["profile", address || name || b3GlobalId, fresh],
    queryFn: () => fetchProfile({ address, name, b3GlobalId, fresh }),
    enabled: (options?.enabled ?? true) && (!!address || !!name || !!b3GlobalId),
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

export function useDisplayName() {
  const setName = async (
    key: string,
    displayName: string,
    signerAddress: string,
    signMessage: (message: string) => Promise<string>,
  ) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `SetDisplayName:${key}:${displayName}:${timestamp}`;

    try {
      const signature = await signMessage(message);

      return setDisplayName({
        key,
        displayName,
        signature,
        signer: signerAddress,
        timestamp,
      });
    } catch (error) {
      throw new Error(`Failed to set display name: ${error}`);
    }
  };

  return { setName };
}

export function useProfileSettings() {
  const { setPreference } = useProfilePreference();
  const { setName } = useDisplayName();

  const updateSettings = async (
    key: string,
    signerAddress: string,
    signMessage: (message: string) => Promise<string>,
    settings: {
      preferredType?: string;
      displayName?: string;
    },
  ) => {
    const results: { preference?: any; displayName?: any } = {};

    try {
      if (settings.preferredType) {
        results.preference = await setPreference(key, settings.preferredType, signerAddress, signMessage);
      }

      if (settings.displayName) {
        results.displayName = await setName(key, settings.displayName, signerAddress, signMessage);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to update profile settings: ${error}`);
    }
  };

  return {
    setPreference,
    setDisplayName: setName,
    updateSettings,
  };
}

export default useProfile;
