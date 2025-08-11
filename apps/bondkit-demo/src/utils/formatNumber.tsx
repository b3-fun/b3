import React from 'react';

/**
 * Formats large numbers into a compact, readable format with suffixes (K, M, B, T).
 * e.g., 12345 -> "12.35K"
 */
export function formatLargeNumber(num: number, digits: number = 2): string {
  if (num === 0) return '0';
  if (num < 1000) return num.toLocaleString(undefined, { maximumFractionDigits: digits });

  const si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "K" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "B" },
    { value: 1E12, symbol: "T" },
  ];

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}

/**
 * Formats very small decimal numbers using subscript notation for leading zeros.
 * e.g., 0.00000123 -> "0.0<sub_>5</sub>123"
 * If the number is not small enough, it formats it as a standard number.
 */
export function formatSmallNumber(num: number, significantDigits: number = 4): React.ReactNode {
  if (num === 0) return '0';

  // If the number is not "very small", format normally up to 8 decimal places.
  if (num > 0.0001) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 8 });
  }

  // Convert to string in a way that avoids scientific notation for small numbers.
  const numStr = num.toExponential(20);
  const match = numStr.match(/(\d\.?\d*)e-(\d+)/);

  if (!match) {
    // Fallback for numbers that don't match the expected exponential format.
    return num.toFixed(8);
  }

  const base = parseFloat(match[1]);
  const exponent = parseInt(match[2], 10);
  
  const zeros = exponent - 1;
  const significantPart = Math.round(base * Math.pow(10, significantDigits -1));

  if (zeros < 3) {
    return num.toFixed(8);
  }

  return (
    <span className="font-mono">
      0.0<sub>{zeros}</sub>{significantPart}
    </span>
  );
}

/**
 * Formats a very small number into a string with underscore notation for leading zeros,
 * suitable for chart labels that don't support JSX.
 * e.g., 0.00000123 -> "0.0_5_123"
 */
export function formatSmallPrice(price: number, significantDigits: number = 4): string {
  if (price === 0) return '0.0';
  
  // For numbers that are not extremely small, use standard formatting.
  if (price > 0.0001) {
    // toPrecision shows significant digits, which is better for prices.
    return price.toPrecision(significantDigits);
  }

  // Use exponential notation to extract parts of the number.
  const numStr = price.toExponential(20);
  const match = numStr.match(/(\d\.?\d*)e-(\d+)/);

  if (!match) {
    return price.toPrecision(significantDigits); // Fallback
  }

  const baseStr = match[1];
  const exponent = parseInt(match[2], 10);
  
  // Extract the significant part of the number.
  const [whole, fraction = ''] = baseStr.split('.');
  const significantPart = (whole + fraction).slice(0, significantDigits);
  
  const zeros = exponent - 1;

  // Don't use the subscript notation if there are only a few zeros.
  if (zeros < 3) {
    return price.toPrecision(significantDigits);
  }

  return `0.0_${zeros}_${significantPart}`;
} 