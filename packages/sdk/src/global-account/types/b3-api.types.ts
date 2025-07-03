// TODO: Get this from the B3 API, compiled version
// For now, we are generating vanilla TS types based on the schema

/**
 * User-related type definitions
 */

// MongoDB ObjectId type
type ObjectId = string;

// Partner IDs interface
interface PartnerIds {
  privyId?: string;
  thirdwebId?: string;
}

// Privy linked account interface
interface PrivyLinkedAccount {
  type: string; // "wallet" | "smart_wallet" | "google_oauth"
  address?: string;
  email?: string;
  lv?: number;
  wallet_client_type?: string;
  smart_wallet_type?: string;
  subject?: string;
  name?: string;
}

// Thirdweb profile interface
interface TWProfile {
  type: string;
  details: {
    id?: string;
    email?: string;
    phone?: string;
    address?: string; // Matches pattern: ^0x[a-fA-F0-9]{40}$
  };
}

// User preferences type (extensible object)
interface UserPreferences {
  [key: string]: any;
}

// Main User interface
interface User {
  _id: ObjectId;
  userId: string;

  // Auth identifiers
  email?: string;
  telNumber?: string;
  smartAccountAddress: string; // Pattern: ^0x[a-fA-F0-9]{40}$

  // Core identity
  username?: string;
  ens?: string;

  // Metadata
  avatar?: string;
  preferences?: UserPreferences;

  // Partner metadata
  referredBy?: ObjectId;
  sourceApp?: string;

  // User groups for permissions
  userGroups?: number[]; // Values 0-10: 0=regular user, 1=admin, 2=moderator, 3=partner

  // Migration
  isMigratedFromBSMNT?: boolean;

  // Timestamps
  createdAt: number;
  updatedAt: number;

  // Partner integrations
  partnerIds: PartnerIds;
  privyLinkedAccounts?: PrivyLinkedAccount[];
  twProfiles?: TWProfile[];
}

export type { ObjectId, PartnerIds, PrivyLinkedAccount, TWProfile, User, UserPreferences };
