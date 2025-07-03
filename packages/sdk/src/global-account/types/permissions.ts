/**
 * Configuration for user permissions when interacting with contracts
 */
export interface PermissionsConfig {
  /**
   * List of contract addresses that are approved for interaction
   */
  approvedTargets: string[];

  /**
   * Maximum amount of native tokens (in ETH) allowed per transaction
   */
  nativeTokenLimitPerTransaction: number;

  /**
   * Date when these permissions become valid
   */
  startDate: Date;

  /**
   * Date when these permissions expire
   */
  endDate: Date;
}
