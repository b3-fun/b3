export function formatNumberWithAbbreviations(num: number, decimals = 2, showFullNumber = false): string {
  if (!showFullNumber && num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + "M";
  } else if (!showFullNumber && num >= 1000) {
    return (num / 1000).toFixed(decimals) + "K";
  } else {
    return num.toFixed(decimals);
  }
}
