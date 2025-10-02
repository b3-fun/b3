import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { getSprinterBaseUrl } from "@b3dotfun/sdk/shared/utils/sprinter";

export interface Asset {
  symbol: string;
  name: string;
}

export interface ChainBalance {
  chainId: number;
  balance: string;
  tokenDecimals: number;
}

export interface AssetBalance {
  symbol: string;
  name: string;
  totalBalance: string;
  chainBalances: ChainBalance[];
}

export const fetchBalances = async (address: string | undefined, testnet?: boolean): Promise<AssetBalance[]> => {
  if (!address) return [];

  const assetsResponse = await fetch(`${getSprinterBaseUrl(testnet)}/assets/fungible`);
  const assetsData = await assetsResponse.json();

  if (assetsData.data) {
    const assets: Asset[] = assetsData.data;

    const balancePromises = assets.map(async asset => {
      const balanceResponse = await fetch(
        `${getSprinterBaseUrl(testnet)}/accounts/${address}/assets/fungible/${asset.symbol}`,
      );
      const balanceData = await balanceResponse.json();

      const chainBalances: ChainBalance[] = balanceData.data;
      const totalBalance = chainBalances.reduce((sum: number, chainBalance: ChainBalance) => {
        return sum + parseInt(chainBalance.balance) / Math.pow(10, chainBalance.tokenDecimals);
      }, 0);

      return {
        symbol: asset.symbol,
        name: asset.name,
        totalBalance: totalBalance.toString(),
        chainBalances,
      };
    });

    const aggregatedBalances = await Promise.all(balancePromises);
    const sprinterUrl = `${getSprinterBaseUrl(testnet)}/accounts/${address}/assets/native`;
    const nativeAssetsResponse = await fetch(sprinterUrl);
    const nativeAssetsData = await nativeAssetsResponse.json();
    const balanceNativePromises = nativeAssetsData.data.map(async (data: any) => {
      try {
        if (!supportedChains.map(chain => chain.id).includes(data.chainId)) {
          return false;
        }

        const gameChain = supportedChains.find(chain => chain.id === data.chainId);
        if (!gameChain) {
          throw new Error("Chain not supported");
        }
        const totalBalance = parseInt(data.balance) / Math.pow(10, data.tokenDecimals);

        return {
          symbol: gameChain?.nativeCurrency.symbol,
          name: "ETH",
          totalBalance: totalBalance.toString(),
          chainBalances: [
            {
              chainId: data.chainId,
              balance: data.balance,
              tokenDecimals: data.tokenDecimals,
            },
          ],
        };
      } catch (error) {
        console.error("Error fetching native asset balance:", error);
        return null;
      }
    });

    const aggregatedBalancesNative = (await Promise.all(balanceNativePromises)).filter(Boolean) as AssetBalance[];
    return [...aggregatedBalancesNative, ...aggregatedBalances];
  }

  return [];
};
