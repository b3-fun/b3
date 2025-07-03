import { defineChain as defineThirdwebChain, Chain as ThirdwebChain } from "thirdweb";
import { Chain, defineChain } from "viem";
import { ChainNetworks } from "@b3dotfun/sdk/global-account/types/chain-networks";

export const nullAddress = "0x0000000000000000000000000000000000000000";

export const avatarsNFTCollectionAddress = "0x658E2F67D3121A0eA81e5854be0b7539be27Aeb0";

// Utility function to convert Viem chain to Thirdweb chain
export const viemToThirdwebChain = (chain: Chain): ThirdwebChain => {
  return defineThirdwebChain({
    id: chain.id,
    name: chain.name,
    rpc: Array.isArray(chain.rpcUrls.default.http) ? chain.rpcUrls.default.http[0] : chain.rpcUrls.default.http,
    nativeCurrency: chain.nativeCurrency,
    blockExplorers: chain.blockExplorers
      ? [
          {
            name: chain.blockExplorers.default.name,
            url: chain.blockExplorers.default.url
          }
        ]
      : undefined,
    testnet: chain.testnet ? true : undefined
  });
};

export const b3Testnet: Chain = defineChain({
  id: 1993,
  name: "B3 Sepolia",
  rpc: "https://sepolia.b3.fun",
  rpcUrls: {
    default: {
      http: ["https://sepolia.b3.fun"],
      ws: ["wss://sepolia.b3.fun/ws"]
    }
  },
  icon: {
    url: "https://cdn.b3.fun/b3_logo.svg",
    width: 32,
    height: 32,
    format: "svg"
  },
  blockExplorers: {
    default: {
      name: "B3 Explorer",
      url: "https://sepolia-explorer.b3.fun"
    }
  },
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  testnet: true
});

export const b3Mainnet = defineChain({
  id: 8333,
  name: "B3",
  rpc: "https://mainnet-rpc.b3.fun",
  rpcUrls: {
    default: {
      http: ["https://mainnet-rpc.b3.fun"],
      ws: ["wss://mainnet-rpc.b3.fun/ws"]
    }
  },
  icon: {
    url: "https://cdn.b3.fun/b3_logo.svg",
    width: 32,
    height: 32,
    format: "svg"
  },
  blockExplorers: {
    default: {
      name: "B3 Explorer",
      url: "https://explorer.b3.fun"
    }
  },
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  }
});

export const getViemChainConfig = (config: ChainNetworks) =>
  defineChain({
    id: config.id,
    name: config.name,
    rpc: config.rpcUrls.default.http,
    rpcUrls: {
      default: {
        http: [config.rpcUrls.default.http],
        ws: [config.rpcUrls.default.ws]
      }
    },
    icon: config.icon,
    blockExplorers: {
      default: {
        name: config.blockExplorers.explorerTitle,
        url: config.blockExplorers.default
      }
    },
    nativeCurrency: config.nativeCurrency,
    testnet: config.testnet ? true : undefined
  });

export const thirdwebB3Testnet: ThirdwebChain = defineThirdwebChain({
  id: 1993,
  name: "B3 Sepolia",
  rpc: "https://sepolia.b3.fun",
  icon: {
    url: "https://cdn.b3.fun/b3_logo.svg",
    width: 32,
    height: 32,
    format: "svg"
  },
  blockExplorers: [
    {
      name: "B3 Explorer",
      url: "https://sepolia-explorer.b3.fun"
    }
  ],
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  testnet: true
});

export const thirdwebB3Mainnet: ThirdwebChain = defineThirdwebChain({
  id: 8333,
  name: "B3",
  rpc: "https://mainnet-rpc.b3.fun/http",
  icon: {
    url: "https://cdn.b3.fun/b3_logo.svg",
    width: 32,
    height: 32,
    format: "svg"
  },
  blockExplorers: [
    {
      name: "B3 Explorer",
      url: "https://explorer.b3.fun"
    }
  ],
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  }
});

export const getThirdwebChainConfig = (config: ChainNetworks): ThirdwebChain =>
  defineThirdwebChain({
    id: config.id,
    name: config.name,
    rpc: config.rpcUrls.default.http,
    icon: config.icon,
    blockExplorers: [
      {
        name: config.blockExplorers.explorerTitle,
        url: config.blockExplorers.default
      }
    ],
    nativeCurrency: config.nativeCurrency,
    testnet: config.testnet ? true : undefined
  });

export const b3Chain = process.env.NEXT_PUBLIC_B3_CHAINID === "8333" ? b3Mainnet : b3Testnet;
export const thirdwebB3Chain: ThirdwebChain =
  process.env.NEXT_PUBLIC_B3_CHAINID === "8333" ? thirdwebB3Mainnet : thirdwebB3Testnet;

export const b3Mask =
  "polygon( 2.209% 8.111%,2.211% 8.08%,2.212% 8.05%,2.212% 8.05%,2.238% 7.434%,2.295% 6.861%,2.382% 6.331%,2.498% 5.841%,2.644% 5.39%,2.817% 4.976%,3.018% 4.598%,3.247% 4.255%,3.502% 3.943%,3.783% 3.664%,3.783% 3.664%,4.107% 3.401%,4.464% 3.165%,4.857% 2.956%,5.285% 2.774%,5.749% 2.62%,6.249% 2.493%,6.786% 2.394%,7.361% 2.323%,7.974% 2.28%,8.625% 2.266%,8.642% 2.266%,8.66% 2.265%,8.66% 2.265%,16.702% 1.748%,24.751% 1.345%,32.805% 1.053%,40.864% 0.872%,48.924% 0.801%,56.984% 0.836%,65.044% 0.977%,73.101% 1.223%,81.153% 1.571%,89.2% 2.02%,89.2% 2.02%,89.394% 2.037%,89.59% 2.052%,89.789% 2.067%,89.989% 2.08%,90.19% 2.093%,90.393% 2.105%,90.596% 2.117%,90.8% 2.128%,91.004% 2.139%,91.207% 2.15%,91.207% 2.15%,91.357% 2.158%,91.506% 2.166%,91.655% 2.174%,91.803% 2.182%,91.95% 2.19%,92.097% 2.199%,92.242% 2.208%,92.386% 2.217%,92.529% 2.227%,92.67% 2.237%,92.67% 2.237%,93.011% 2.264%,93.347% 2.294%,93.677% 2.329%,94.002% 2.369%,94.321% 2.414%,94.634% 2.466%,94.94% 2.525%,95.239% 2.592%,95.53% 2.667%,95.813% 2.751%,95.813% 2.751%,96.087% 2.844%,96.349% 2.947%,96.6% 3.059%,96.839% 3.181%,97.066% 3.314%,97.282% 3.457%,97.485% 3.612%,97.676% 3.779%,97.855% 3.957%,98.021% 4.148%,98.021% 4.148%,98.172% 4.349%,98.313% 4.567%,98.444% 4.802%,98.563% 5.057%,98.67% 5.332%,98.764% 5.628%,98.845% 5.947%,98.912% 6.289%,98.964% 6.656%,99.001% 7.048%,99.002% 7.052%,99.002% 7.056%,99.002% 7.056%,99.127% 8.717%,99.245% 10.378%,99.355% 12.04%,99.46% 13.703%,99.56% 15.367%,99.654% 17.032%,99.745% 18.697%,99.832% 20.363%,99.917% 22.029%,100% 23.696%,100% 23.696%,100.219% 29.737%,100.382% 35.779%,100.489% 41.822%,100.539% 47.865%,100.534% 53.909%,100.472% 59.953%,100.353% 65.996%,100.179% 72.037%,99.947% 78.077%,99.659% 84.114%,99.659% 84.114%,99.655% 84.186%,99.651% 84.259%,99.646% 84.331%,99.642% 84.404%,99.637% 84.476%,99.633% 84.549%,99.629% 84.621%,99.624% 84.693%,99.615% 84.838%,99.615% 84.838%,99.565% 85.657%,99.515% 86.476%,99.464% 87.294%,99.412% 88.111%,99.36% 88.929%,99.306% 89.746%,99.251% 90.562%,99.194% 91.378%,99.135% 92.194%,99.074% 93.01%,99.072% 93.031%,99.071% 93.052%,99.071% 93.052%,99.049% 93.479%,99.012% 93.894%,98.959% 94.296%,98.89% 94.686%,98.805% 95.062%,98.702% 95.422%,98.582% 95.768%,98.444% 96.096%,98.288% 96.408%,98.113% 96.701%,98.113% 96.701%,97.92% 96.974%,97.703% 97.232%,97.461% 97.475%,97.194% 97.699%,96.898% 97.904%,96.574% 98.088%,96.219% 98.249%,95.833% 98.385%,95.414% 98.495%,94.961% 98.577%,94.961% 98.577%,92.494% 98.801%,90.025% 98.998%,87.553% 99.171%,85.079% 99.324%,82.604% 99.46%,80.126% 99.58%,77.648% 99.689%,75.169% 99.79%,72.689% 99.884%,70.208% 99.975%,69.528% 100%,69.528% 100%,69.528% 100%,69.528% 100%,69.528% 100%,69.528% 100%,69.528% 100%,69.527% 100%,69.527% 100%,69.527% 100%,69.527% 100%,63.379% 100.153%,57.23% 100.245%,51.081% 100.277%,44.931% 100.248%,38.783% 100.158%,32.635% 100.006%,26.489% 99.792%,20.346% 99.515%,14.205% 99.176%,8.068% 98.774%,8.058% 98.773%,8.048% 98.773%,8.048% 98.773%,7.501% 98.746%,6.992% 98.698%,6.518% 98.63%,6.079% 98.545%,5.673% 98.441%,5.299% 98.321%,4.956% 98.186%,4.641% 98.036%,4.354% 97.873%,4.094% 97.697%,4.094% 97.697%,3.862% 97.513%,3.65% 97.317%,3.457% 97.108%,3.281% 96.887%,3.123% 96.654%,2.98% 96.409%,2.852% 96.152%,2.737% 95.884%,2.635% 95.605%,2.545% 95.314%,2.545% 95.314%,2.463% 95.004%,2.391% 94.682%,2.329% 94.349%,2.276% 94.006%,2.23% 93.651%,2.192% 93.286%,2.159% 92.911%,2.131% 92.525%,2.106% 92.129%,2.085% 91.722%,2.085% 91.722%,2.081% 91.635%,2.077% 91.548%,2.073% 91.46%,2.069% 91.371%,2.066% 91.282%,2.062% 91.193%,2.058% 91.103%,2.054% 91.013%,2.051% 90.923%,2.047% 90.832%,2.047% 90.832%,2.033% 90.503%,2.019% 90.171%,2.003% 89.835%,1.986% 89.496%,1.966% 89.156%,1.944% 88.814%,1.918% 88.471%,1.889% 88.127%,1.855% 87.785%,1.817% 87.443%,1.817% 87.443%,1.594% 83.762%,1.403% 80.079%,1.241% 76.394%,1.104% 72.707%,0.99% 69.019%,0.894% 65.329%,0.813% 61.638%,0.744% 57.946%,0.682% 54.254%,0.626% 50.561%,0.626% 50.561%,0.637% 49.992%,0.648% 49.423%,0.659% 48.854%,0.67% 48.286%,0.681% 47.717%,0.692% 47.148%,0.703% 46.58%,0.713% 46.011%,0.724% 45.443%,0.734% 44.874%,0.734% 44.874%,0.782% 42.326%,0.831% 39.779%,0.884% 37.232%,0.941% 34.685%,1.006% 32.14%,1.078% 29.595%,1.161% 27.051%,1.255% 24.508%,1.363% 21.965%,1.485% 19.424%,1.485% 19.424%,1.493% 19.294%,1.5% 19.165%,1.508% 19.035%,1.515% 18.906%,1.523% 18.776%,1.531% 18.647%,1.538% 18.517%,1.546% 18.388%,1.553% 18.258%,1.561% 18.129%,1.561% 18.129%,1.619% 17.124%,1.678% 16.121%,1.737% 15.118%,1.798% 14.116%,1.86% 13.114%,1.925% 12.113%,1.991% 11.112%,2.06% 10.111%,2.133% 9.111%,2.209% 8.111% )";
