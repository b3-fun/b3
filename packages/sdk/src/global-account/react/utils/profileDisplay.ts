import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { type Profile } from "thirdweb/wallets";

const debug = debugB3React("profileDisplay");

/**
 * Validates that an image URL uses an allowed schema
 * @param url - The URL to validate
 * @returns The URL if valid, null otherwise
 */
export function validateImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    // For blob URLs (from createObjectURL)
    if (url.startsWith("blob:")) {
      return url;
    }

    // For IPFS protocol URLs
    if (url.startsWith("ipfs://")) {
      return url;
    }

    // Parse URL to validate protocol and hostname
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      debug("Rejected unsafe protocol:", parsedUrl.protocol, url);
      return null;
    }

    // Whitelist of allowed IPFS gateway hostnames
    const allowedIpfsGateways = [
      "ipfs.io",
      "gateway.pinata.cloud",
      "cloudflare-ipfs.com",
      "dweb.link",
      "nftstorage.link",
      "w3s.link",
    ];

    // Check if hostname matches allowed IPFS gateways
    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowedIpfsGateway = allowedIpfsGateways.some(gateway => {
      // Exact match or subdomain of the gateway
      return hostname === gateway || hostname.endsWith(`.${gateway}`);
    });

    if (isAllowedIpfsGateway) {
      return url;
    }

    // For standard HTTP(S) URLs from trusted sources
    // Add additional hostname validation here if needed
    // For now, allow all HTTP(S) URLs (can be restricted further if needed)
    return url;
  } catch (error) {
    // Invalid URL format
    debug("Invalid image URL format:", url, error);
    return null;
  }
}

export interface ExtendedProfileDetails {
  fid?: string;
  id?: string;
  email?: string;
  phone?: string;
  address?: string;
  name?: string;
  username?: string;
  profileImageUrl?: string;
  picture?: string; // Google OAuth uses 'picture' field
  pfpUrl?: string; // Farcaster uses 'pfpUrl' field
}

export interface ExtendedProfile extends Omit<Profile, "details"> {
  details: ExtendedProfileDetails;
}

export interface ProfileDisplayInfo {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  initial: string;
  type: Profile["type"];
}

export function getProfileDisplayInfo(profile: ExtendedProfile): ProfileDisplayInfo {
  const { type, details } = profile;

  // Default display info
  let displayInfo: ProfileDisplayInfo = {
    title: details.email || details.phone || details.address || "Unknown",
    subtitle: `Connected with ${type}`,
    imageUrl: null,
    initial: (type.charAt(0) || "U").toUpperCase(),
    type,
  };

  // Handle specific providers
  switch (type) {
    case "x":
      displayInfo = {
        title: details.name || details.username || "Unknown",
        subtitle: details.username ? `@${details.username}` : "X Account",
        imageUrl: validateImageUrl(details.profileImageUrl),
        initial: "X",
        type,
      };
      break;
    case "farcaster":
      displayInfo = {
        title: details.name || details.username || "FID:" + details?.fid || "Unknown",
        subtitle: details.username ? `@${details.username}` : "Farcaster Account",
        imageUrl: validateImageUrl(details.pfpUrl || details.profileImageUrl),
        initial: "F",
        type,
      };
      break;
    case "google":
      displayInfo = {
        title: details.name || details.email || "Unknown",
        subtitle: details.email || "Google Account",
        imageUrl: validateImageUrl(details.picture || details.profileImageUrl),
        initial: "G",
        type,
      };
      break;
    case "discord":
      displayInfo = {
        title: details.username || details.name || "Unknown",
        subtitle: "Discord Account",
        imageUrl: validateImageUrl(details.profileImageUrl),
        initial: "D",
        type,
      };
      break;
    case "email":
      displayInfo = {
        title: details.email || "Unknown",
        subtitle: "Email Account",
        imageUrl: null,
        initial: "E",
        type,
      };
      break;
    case "phone":
      displayInfo = {
        title: details.phone || "Unknown",
        subtitle: "Phone Number",
        imageUrl: null,
        initial: "P",
        type,
      };
      break;
  }

  return displayInfo;
}
