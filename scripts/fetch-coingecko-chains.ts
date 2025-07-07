import fs from "fs/promises";
import path from "path";

interface CoinGeckoChain {
  id: string;
  chain_identifier: number | null;
  name: string;
  shortname: string;
  native_coin_id: string;
  image: {
    thumb: string | null;
    small: string | null;
    large: string | null;
  };
}

async function fetchCoinGeckoChains() {
  try {
    console.log("🔍 Fetching chain data from CoinGecko API...");

    const response = await fetch("https://api.coingecko.com/api/v3/asset_platforms");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const chains: CoinGeckoChain[] = await response.json();

    // Filter out chains without chain_identifier
    const chainsWithIdentifiers = chains.filter(chain => chain.chain_identifier !== null);

    console.log(
      `✅ Found ${chainsWithIdentifiers.length} chains with identifiers out of ${chains.length} total chains`
    );

    // Create a mapping of chain IDs to their identifiers
    const chainMapping = chainsWithIdentifiers.reduce(
      (acc, chain) => {
        acc[chain.chain_identifier!] = {
          coingecko_id: chain.id,
          name: chain.name,
          native_coin_id: chain.native_coin_id
        };
        return acc;
      },
      {} as Record<number, { coingecko_id: string; name: string; native_coin_id: string }>
    );

    // Ensure the output directory exists
    const outputDir = path.join(__dirname, "..", "packages", "sdk", "src", "shared", "generated");
    await fs.mkdir(outputDir, { recursive: true });

    // Write the chain mapping data to a JSON file
    const outputPath = path.join(outputDir, "coingecko-chains.json");
    await fs.writeFile(outputPath, JSON.stringify(chainMapping, null, 2));

    console.log(`✅ CoinGecko chain mapping saved to ${outputPath}`);
  } catch (error) {
    console.error("Error fetching CoinGecko chains:", error);
    process.exit(1);
  }
}

fetchCoinGeckoChains();
