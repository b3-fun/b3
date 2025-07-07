export interface TokenInfo {
  data: {
    attributes: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      image_url: string;
    };
  };
}

export async function fetchTokenInfo(network: string, address: string): Promise<TokenInfo> {
  const response = await fetch("https://api.b3.fun/tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Method": "getCoinGeckoTokenInfo"
    },
    body: JSON.stringify({
      network,
      address
    })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch token info");
  }

  return response.json();
}
