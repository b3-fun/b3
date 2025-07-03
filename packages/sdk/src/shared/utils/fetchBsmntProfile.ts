const baseUrl =
  process.env.NEXT_PUBLIC_BASEMENT_API_URL ||
  process.env.NEXT_PUBLIC_FEATHERS_API ||
  "https://basement-feathers-api-production.up.railway.app";

export async function fetchBsmntProfile(username?: string, address?: string) {
  let response: Response | undefined;

  const queryUsername = username?.includes(".b3.fun") ? username : `${username}.b3.fun`;

  try {
    if (username) {
      response = await fetch(`${baseUrl}/profiles/?username=${queryUsername}`);
    } else if (address) {
      response = await fetch(
        `${baseUrl}/profiles/?linkedAccounts[$elemMatch][normalizedAddress]=${String(address).toLowerCase() || ""}`
      );
    }

    const json = await response?.json();

    if (json.data.length == 0) throw new Error(`Profile not found`);

    return json.data[0];
  } catch (error) {
    console.error("Error fetching profile", error);
    throw error;
  }
}
