const fs = require("fs/promises");
const path = require("path");

async function fetchChainNetworks() {
  // Get the feature filter from command line arguments
  const featureFilter = process.argv[2];

  if (!featureFilter) {
    console.warn(
      "⚠️  No feature filter provided. Including all chains. Usage: yarn chain-networks <feature> ex. basement"
    );
  }

  try {
    const chainsResponse = await fetch("https://api.basement.fun/chain-networks?$limit=100");
    if (!chainsResponse.ok) {
      throw new Error(`HTTP error! status: ${chainsResponse.status}`);
    }
    const chainsJson = await chainsResponse.json();

    // Ensure we have data
    if (!chainsJson.data || !Array.isArray(chainsJson.data)) {
      throw new Error("Invalid response format");
    }

    // Filter chains that have the specified feature in their enabledFeatures
    // If no feature filter is provided, include all chains
    const filteredChains = featureFilter
      ? chainsJson.data.filter((chain: any) => {
          const chainFeatureFlags = chain?.enabledFeatures;
          console.log("chainFeatureFlags :", chainFeatureFlags);
          if (!chainFeatureFlags || !Array.isArray(chainFeatureFlags)) {
            return false;
          }

          return chainFeatureFlags.includes(featureFilter);
        })
      : chainsJson.data;

    if (featureFilter) {
      console.log(`✅ Found ${filteredChains.length} chains with feature "${featureFilter}"`);
    } else {
      console.log(`✅ Including all ${filteredChains.length} chains`);
    }
    console.log(
      "Filtered chains:",
      filteredChains.map((chain: any) => ({
        id: chain.id,
        name: chain.name,
        enabledFeatures: chain.enabledFeatures
      }))
    );

    // Create the output directory if it doesn't exist
    const outputDir = path.join(__dirname, "..", "generated");
    await fs.mkdir(outputDir, { recursive: true });

    // Write the filtered chain networks data to a JSON file
    const outputPath = path.join(outputDir, `chain-networks.json`);
    await fs.writeFile(outputPath, JSON.stringify(filteredChains, null, 2));

    console.log(`✅ Filtered chain networks data saved to ${outputPath}`);
  } catch (error) {
    console.error("Error fetching chain networks:", error);
    process.exit(1);
  }
}

// Run the script directly if not imported
if (require.main === module) {
  fetchChainNetworks();
}

module.exports = fetchChainNetworks;
