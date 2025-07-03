export default function centerTruncate(str: string, x: number = 6, y: number = 4): string {
  if (!str) return "";

  if (x + y >= str?.length) {
    // If x + y is greater than or equal to the length of the string, return the original string
    return str;
  }

  const start = str.slice(0, x);
  const end = str.slice(-y);
  return `${start}...${end}`;
}
