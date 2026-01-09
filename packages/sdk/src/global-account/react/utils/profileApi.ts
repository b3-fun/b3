import type { CombinedProfile } from "../hooks/useProfile";

export const PROFILES_API_URL = "https://profiles.b3.fun";

/**
 * Fetch a user profile from the B3 Profiles API
 * @param params - Search parameters (address, name, or b3GlobalId)
 * @returns Promise resolving to CombinedProfile or null if not found
 */
export async function fetchProfile({
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
