/**
 * Number formatting utilities
 */

export function formatNumberSmall(value: number, includeSign = false): string {
  if (value === 0) return "0";

  const sign = includeSign && value > 0 ? "+" : "";

  // Handle very small numbers with scientific notation
  if (Math.abs(value) < 0.000001) {
    return sign + value.toExponential(2);
  }

  // Handle small numbers with appropriate decimal places
  if (Math.abs(value) < 0.0001) {
    return sign + value.toFixed(8);
  }

  if (Math.abs(value) < 0.01) {
    return sign + value.toFixed(6);
  }

  if (Math.abs(value) < 1) {
    return sign + value.toFixed(4);
  }

  // For larger numbers, use standard formatting
  return (
    sign +
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  );
}
