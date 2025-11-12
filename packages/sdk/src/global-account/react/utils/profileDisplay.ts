import { type Profile } from "thirdweb/wallets";

export interface ExtendedProfileDetails {
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
        imageUrl: details.profileImageUrl || null,
        initial: "X",
        type,
      };
      break;
    case "farcaster":
      displayInfo = {
        title: details.name || details.username || "Unknown",
        subtitle: details.username ? `@${details.username}` : "Farcaster Account",
        imageUrl: details.pfpUrl || details.profileImageUrl || null,
        initial: "F",
        type,
      };
      break;
    case "google":
      displayInfo = {
        title: details.name || details.email || "Unknown",
        subtitle: details.email || "Google Account",
        imageUrl: details.picture || details.profileImageUrl || null,
        initial: "G",
        type,
      };
      break;
    case "discord":
      displayInfo = {
        title: details.username || details.name || "Unknown",
        subtitle: "Discord Account",
        imageUrl: details.profileImageUrl || null,
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
