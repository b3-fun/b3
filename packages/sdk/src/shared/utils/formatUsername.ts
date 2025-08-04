export function formatUsername(username?: string) {
  if (!username) return "";
  // Remove .b3.fun and put an @ before it
  // Make it all lowercase
  return `@${username.replace(".b3.fun", "").toLowerCase()}` || undefined;
}
