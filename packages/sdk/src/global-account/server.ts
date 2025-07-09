const B3_API_URL = process.env.NEXT_PUBLIC_B3_API || process.env.PUBLIC_B3_API || "https://api.b3.fun";

/**
 * Authenticate with the B3 API using the token
 * Server-side only version that doesn't include socket.io dependencies
 *
 * @param token - The token to authenticate with
 * @returns The response from the B3 API
 */
export const authenticateWithRest = async (token: string) => {
  const response = await fetch(`${B3_API_URL}/authentication`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      strategy: "jwt",
      accessToken: token,
    }),
  });
  return response;
};
