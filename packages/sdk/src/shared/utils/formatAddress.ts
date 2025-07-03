import { getAddress } from "thirdweb";

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function shortenAddress(address: string, length = 4) {
  // EVM address
  try {
    const _address = getAddress(address);
    return `${_address.slice(0, length + 2)}...${_address.slice(-length)}`;
  } catch {}

  // Solana
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}
