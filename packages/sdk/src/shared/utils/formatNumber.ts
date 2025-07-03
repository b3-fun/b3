/**
 * Type guard to check if a value is a string
 * @param value The value to check
 * @returns True if the value is a string, false otherwise
 */
export function isString(value: unknown): value is string {
  return typeof value === "string" || value instanceof String;
}

export function formatNumber(amount: number | string, decimals: number = 3, useAbbreviations: boolean = false): string {
  if (isString(amount)) {
    amount = parseFloat(amount);
    if (isNaN(amount)) {
      throw new Error("Invalid number format");
    }
  }

  if (useAbbreviations) {
    if (amount >= 1e24) return `${Math.floor((amount / 1e24) * Math.pow(10, decimals)) / Math.pow(10, decimals)}Y`; // Yotta
    if (amount >= 1e21) return `${Math.floor((amount / 1e21) * Math.pow(10, decimals)) / Math.pow(10, decimals)}Z`; // Zetta
    if (amount >= 1e18) return `${Math.floor((amount / 1e18) * Math.pow(10, decimals)) / Math.pow(10, decimals)}E`; // Exa
    if (amount >= 1e15) return `${Math.floor((amount / 1e15) * Math.pow(10, decimals)) / Math.pow(10, decimals)}P`; // Peta
    if (amount >= 1e12) return `${Math.floor((amount / 1e12) * Math.pow(10, decimals)) / Math.pow(10, decimals)}T`; // Tera
    if (amount >= 1e9) return `${Math.floor((amount / 1e9) * Math.pow(10, decimals)) / Math.pow(10, decimals)}B`; // Giga
    if (amount >= 1e6) return `${Math.floor((amount / 1e6) * Math.pow(10, decimals)) / Math.pow(10, decimals)}M`; // Mega
    if (amount >= 1e3) return `${Math.floor((amount / 1e3) * Math.pow(10, decimals)) / Math.pow(10, decimals)}K`; // Kilo
  }

  // Round to the specified number of decimal places
  const rounded = Number(amount.toFixed(decimals));

  // Convert to string and split into integer and decimal parts
  const [intPart, decPart] = rounded.toString().split(".");

  // Format integer part with commas
  const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // If the rounded number is zero, return '0'
  if (rounded === 0) return "0";

  // Combine parts, trimming trailing zeros from decimal part
  return decPart ? `${formattedIntPart}.${decPart.replace(/0+$/, "")}` : formattedIntPart;
}
