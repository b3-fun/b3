import Big from "big.js";
import { parseUnits } from "viem";

// Configure Big.js to use exponential notation only for very large/small numbers
Big.PE = 40; // Precision for exponential notation (higher = less use of exponential)

// Convert a token amount to a human-readable decimal
// n = "10000000000000000000", decimals = 9 => "10.0" (10 tokens with 9 decimals)
export function divpowToBig(n: string | number | bigint, decimals: number): Big {
  const value = new Big(n.toString());
  const divisor = new Big(10).pow(decimals);
  return value.div(divisor);
}

// Convert a human-readable decimal to a token amount
// s = "0.000000000000001", multiplier = 18 => 1000 (0.000000000000001 ETH with 18 decimals = 1000 wei)
export function mulpowToBig(s: string, multiplier = 18): Big {
  if (!s || s === "") {
    return new Big(0);
  }

  // Parse the string into wei/atomic units
  const atomicUnits = parseUnits(truncateValue(s, multiplier), multiplier).toString();
  // Return the number of atomic units
  return new Big(atomicUnits);
}

export function truncateValue(value: string, decimals: number): string {
  if (!value || value === "") {
    return "0";
  }

  // Special case for decimal-only input
  if (value === ".") return "0";

  // Handle case where value starts with decimal point
  if (value.startsWith(".")) {
    value = "0" + value;
  }

  const parts = value.split(/\./);
  if (parts.length > 1) {
    // Remove leading zeros from whole part
    parts[0] = parts[0].replace(/^0+(?=\d)/, "");
    if (parts[0] === "") parts[0] = "0"; // If whole part is empty, set to '0'

    // Limit decimal part to specified number of places
    parts[1] = parts[1].slice(0, decimals);

    // Remove trailing zeros from decimal part
    parts[1] = parts[1].replace(/0+$/, "");

    // Special case for very small numbers where all digits get truncated
    if (parts[1] === "" || parts[1].match(/^0+$/)) {
      return parts[0];
    }

    // If the decimal part is empty after processing, return just the whole part
    if (parts[1] === "") {
      return parts[0];
    }

    const res = `${parts[0]}.${parts[1]}`;
    return res;
  }

  // For numbers without a decimal part
  const cleanValue = value.replace(/^0+(?=\d)/, ""); // Remove leading zeros.
  return cleanValue || "0"; // Return '0' if the result is an empty string
}

export const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Round up a number to the nearest multiple of 0.01 USDC, which is 10^4 USDC base units
 * @param value - The number to round up
 * @returns The rounded number
 * For example, roundUpUSDCBaseAmountToNearest("2663988") = "2670000"
 */
export function roundUpUSDCBaseAmountToNearest(value: string): string {
  const divisor = new Big(10).pow(4); // Round to nearest 10,000
  const srcAmountBig = new Big(value);
  const remainder = srcAmountBig.mod(divisor);
  // If remainder is already 0 (exactly divisible by 10^4), return the original amount
  if (remainder.eq(0)) {
    return value;
  }
  const res = srcAmountBig.plus(divisor.minus(remainder)).toString();
  return res;
}
