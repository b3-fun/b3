// Validation utilities
export function isValidEvmAddress(address) {
  // Check if address is a valid EVM address (42 characters, starts with 0x, valid hex)
  if (!address || typeof address !== "string") {
    return false;
  }

  // Remove whitespace and convert to lowercase
  const cleanAddress = address.trim().toLowerCase();

  // Check format: 0x followed by 40 hex characters
  const evmAddressRegex = /^0x[a-f0-9]{40}$/;
  return evmAddressRegex.test(cleanAddress);
}

// Formatting utilities
export function formatAmount(amount, decimals) {
  try {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** Number(decimals));
    const wholePart = num / divisor;
    const fractionalPart = num % divisor;

    if (fractionalPart === 0n) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(Number(decimals), "0");
    const trimmedFractional = fractionalStr.replace(/0+$/, "");

    if (trimmedFractional === "") {
      return wholePart.toString();
    }

    return `${wholePart.toString()}.${trimmedFractional}`;
  } catch (error) {
    return amount;
  }
}
