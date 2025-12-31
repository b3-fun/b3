import { isAddress } from "viem";
import { HYPERLIQUID_CHAIN_ID } from "./token";

export function isSolanaAddress(address: string): boolean {
  // Solana addresses are 32-byte base58 strings (usually 32-44 characters)
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaAddressRegex.test(address);
}

export function isEvmOrSolanaAddress(address: string): boolean {
  return isAddress(address) || isSolanaAddress(address);
}

/**
 * Check if an address is Hyperliquid's special USDC address.
 * Hyperliquid USDC uses a special 34-character format (0x + 32 hex digits)
 * instead of the standard 42-character Ethereum address format.
 * This is required by Relay SDK for Hyperliquid integration.
 *
 * @param chainId - The chain ID to check
 * @param address - The token address to validate
 * @returns true if the address is Hyperliquid USDC's special format
 */
export function isHyperliquidUSDC(chainId: number, address: string): boolean {
  return chainId === HYPERLIQUID_CHAIN_ID && address.toLowerCase() === "0x00000000000000000000000000000000";
}

export function normalizeAddress(address: string): string {
  if (isSolanaAddress(address)) {
    return address;
  }
  return address.toLowerCase(); // EVM address will normalize to lower case
}

// Equal case insensitive
export function eqci(a: string | null | undefined, b: string | null | undefined) {
  if (a === "" && b === "") return true;
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Check if source and destination represent the same token on the same chain.
 * When true, this is a pure transfer (no swap/bridge needed).
 */
export function isSameChainAndToken(
  sourceChainId: number,
  sourceTokenAddress: string,
  destinationChainId: number,
  destinationTokenAddress: string,
): boolean {
  return sourceChainId === destinationChainId && eqci(sourceTokenAddress, destinationTokenAddress);
}
