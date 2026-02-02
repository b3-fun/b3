export interface PartnerConfig {
  returnToHomeUrl?: string;
  customRecipientLabel?: string;
  returnHomeLabel?: string;
}

const partnerConfigs: Record<string, PartnerConfig> = {
  // Add partner-specific configs here
  // Example:
  // "partner-name": {
  //   returnToHomeUrl: "https://partner.com",
  //   customRecipientLabel: "Partner Wallet",
  //   returnHomeLabel: "Return to Partner",
  // },
};

export function getPartnerConfig(partner?: string): PartnerConfig | undefined {
  if (!partner) return undefined;
  return partnerConfigs[partner];
}
