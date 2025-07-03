import { isAddress } from "viem";

export function isSolanaAddress(address: string): boolean {
  // Solana addresses are 32-byte base58 strings (usually 32-44 characters)
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaAddressRegex.test(address);
}

export function isEvmOrSolanaAddress(address: string): boolean {
  return isAddress(address) || isSolanaAddress(address);
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
