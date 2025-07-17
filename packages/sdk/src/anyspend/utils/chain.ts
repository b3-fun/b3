import invariant from "invariant";
import {
  Account,
  Chain,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  PublicClient,
  Transport,
  WalletClient,
} from "viem";
import {
  arbitrum,
  avalanche,
  b3,
  b3Sepolia,
  base,
  baseSepolia,
  bsc,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "viem/chains";
import { RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend/constants";
import { getAvaxToken, getBnbToken, getEthToken, getPolToken, getSolanaToken } from "./token";
import { ChainType, IBaseChain, IEVMChain, ISolanaChain } from "../types/chain";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

function getCustomEvmChain(chain: Chain, rpcUrl: string): Chain {
  return defineChain({ ...chain, rpcUrls: { default: { http: [rpcUrl] } } });
}

// export const b4testnet = defineChain({
//   id: 19934,
//   name: "B4 Testnet",
//   network: "b4-testnet",
//   nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
//   rpcUrls: { default: { http: ["https://19934.rpc.thirdweb.com/c2dce731fe7fa39edc1d0ea5a6a5e11e"] } },
// });

export const EVM_MAINNET: Record<number, IEVMChain> = {
  [mainnet.id]: {
    id: mainnet.id,
    name: mainnet.name,
    type: ChainType.EVM,
    logoUrl: "https://assets.relay.link/icons/square/1/light.png",
    nativeRequired: parseEther("0.001"),
    canDepositNative: true,
    defaultToken: getEthToken(mainnet.id),
    nativeToken: getEthToken(mainnet.id),
    viem: getCustomEvmChain(
      mainnet,
      "https://quick-chaotic-film.quiknode.pro/39a7aae6a7078f9f36c435e6f34c071c641cf863/",
    ),
    pollingInterval: 4000, // 4 seconds for Ethereum mainnet
    zapperEnum: "ETHEREUM_MAINNET",
    coingeckoName: "eth",
  },
  [arbitrum.id]: {
    id: arbitrum.id,
    name: "Arbitrum",
    type: ChainType.EVM,
    logoUrl: "https://assets.relay.link/icons/square/42161/light.png",
    nativeRequired: parseEther("0.0001"),
    canDepositNative: true,
    defaultToken: getEthToken(arbitrum.id),
    nativeToken: getEthToken(arbitrum.id),
    viem: getCustomEvmChain(
      arbitrum,
      "https://proportionate-twilight-patina.arbitrum-mainnet.quiknode.pro/60e4825626515233a0f566f5915601af6043127b/",
    ),
    pollingInterval: 500, // 500ms for Arbitrum's fast blocks
    zapperEnum: "ARBITRUM_MAINNET",
    coingeckoName: "arbitrum",
  },
  [base.id]: {
    id: base.id,
    name: base.name,
    logoUrl: "https://assets.relay.link/icons/square/8453/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.0001"),
    canDepositNative: true,
    defaultToken: getEthToken(base.id),
    nativeToken: getEthToken(base.id),
    viem: getCustomEvmChain(
      base,
      "https://sly-indulgent-bird.base-mainnet.quiknode.pro/4e31fab6845eb29a2764723a43896999fe962e48/",
    ),
    pollingInterval: 1000, // 1 second for Base
    zapperEnum: "BASE_MAINNET",
    coingeckoName: "base",
  },
  [optimism.id]: {
    id: optimism.id,
    name: optimism.name,
    logoUrl: "https://assets.relay.link/icons/square/10/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.0001"),
    canDepositNative: true,
    defaultToken: getEthToken(optimism.id),
    nativeToken: getEthToken(optimism.id),
    viem: getCustomEvmChain(
      optimism,
      "https://black-cosmopolitan-hexagon.optimism.quiknode.pro/18382925841f9d09f9e76eef954bf189aa234523/",
    ),
    pollingInterval: 1000, // 1 second for Optimism
    zapperEnum: "OPTIMISM_MAINNET",
    coingeckoName: "optimism",
  },
  [polygon.id]: {
    id: polygon.id,
    name: polygon.name,
    logoUrl: "https://assets.relay.link/icons/square/137/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.1"),
    canDepositNative: true,
    defaultToken: getPolToken(),
    nativeToken: getPolToken(),
    viem: getCustomEvmChain(
      polygon,
      "https://purple-young-field.matic.quiknode.pro/ca54f365c1a4c7f970223eb8087e0fc579feba12/",
    ),
    pollingInterval: 1000, // 1 second for Polygon
    zapperEnum: "POLYGON_MAINNET",
    coingeckoName: "polygon",
  },
  [avalanche.id]: {
    id: avalanche.id,
    name: avalanche.name,
    logoUrl: "https://assets.relay.link/icons/square/43114/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.005"),
    canDepositNative: true,
    defaultToken: getAvaxToken(),
    nativeToken: getAvaxToken(),
    viem: getCustomEvmChain(
      avalanche,
      "https://burned-billowing-pond.avalanche-mainnet.quiknode.pro/24289978a524a18ef42e568e04fe8cad8c7b6720/ext/bc/C/rpc/",
    ),
    pollingInterval: 1000, // 1 second for Avalanche
    zapperEnum: "AVALANCHE_MAINNET",
    coingeckoName: "avalanche",
  },
  [bsc.id]: {
    id: bsc.id,
    name: bsc.name,
    logoUrl: "https://avatars.githubusercontent.com/u/45615063?s=280&v=4",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.00001"),
    canDepositNative: false,
    defaultToken: getBnbToken(),
    nativeToken: getBnbToken(),
    viem: getCustomEvmChain(bsc, "https://bsc-rpc.publicnode.com"),
    pollingInterval: 1000, // 1 second for BSC
    zapperEnum: "BSC_MAINNET",
    coingeckoName: "bsc",
  },
  [b3.id]: {
    id: b3.id,
    name: b3.name,
    logoUrl: "https://assets.relay.link/icons/square/8333/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.0001"),
    canDepositNative: true,
    defaultToken: getEthToken(b3.id),
    nativeToken: getEthToken(b3.id),
    viem: getCustomEvmChain(
      b3,
      "https://late-dimensional-yard.b3-mainnet.quiknode.pro/461dbdbd44158cd7a7a764a58ffb01a67eef77f2/",
    ),
    pollingInterval: 1000, // 1 second for B3
    zapperEnum: "B3_MAINNET",
    coingeckoName: "b3",
  },
};

export const EVM_TESTNET: Record<number, IEVMChain> = {
  [sepolia.id]: {
    id: sepolia.id,
    name: sepolia.name,
    logoUrl: "https://assets.relay.link/icons/square/1/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.00001"),
    canDepositNative: true,
    defaultToken: getEthToken(sepolia.id),
    nativeToken: getEthToken(sepolia.id),
    viem: sepolia,
    pollingInterval: 1000, // 1 second for Sepolia
  },
  [baseSepolia.id]: {
    id: baseSepolia.id,
    name: baseSepolia.name,
    logoUrl: "https://assets.relay.link/icons/square/8453/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.00001"),
    canDepositNative: true,
    defaultToken: getEthToken(baseSepolia.id),
    nativeToken: getEthToken(baseSepolia.id),
    viem: baseSepolia,
    pollingInterval: 1000, // 1 second for Base Sepolia
  },
  [b3Sepolia.id]: {
    id: b3Sepolia.id,
    name: b3Sepolia.name,
    logoUrl: "https://assets.relay.link/icons/square/8333/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.00001"),
    canDepositNative: true,
    defaultToken: getEthToken(b3Sepolia.id),
    nativeToken: getEthToken(b3Sepolia.id),
    viem: b3Sepolia,
    pollingInterval: 1000, // 1 second for B3 Sepolia
  },
  // [b4testnet.id]: {
  //   id: b4testnet.id,
  //   logoUrl: "https://cdn.b3.fun/b4-logo.png",
  //   type: ChainType.EVM,
  //   viem: b4testnet,
  //   requireNativeBalance: parseEther("0.00001"),
  //   supportDepositNative: true,
  // },
};

export const SOLANA_MAINNET: ISolanaChain = {
  id: RELAY_SOLANA_MAINNET_CHAIN_ID,
  name: "Solana",
  logoUrl: "https://assets.relay.link/icons/square/792703809/light.png",
  type: ChainType.SOLANA,
  nativeRequired: BigInt(10000000), // 0.01 SOL
  canDepositNative: true,
  defaultToken: getSolanaToken(),
  nativeToken: getSolanaToken(),
};

export const EVM_CHAINS: Record<number, IEVMChain> = { ...EVM_MAINNET, ...EVM_TESTNET };

export const SOLANA_CHAINS: Record<number, ISolanaChain> = { [RELAY_SOLANA_MAINNET_CHAIN_ID]: SOLANA_MAINNET };

export const ALL_CHAINS: Record<number, IBaseChain> = { ...EVM_CHAINS, ...SOLANA_CHAINS };

export function getSolanaChains(network: "mainnet" | "testnet"): ISolanaChain {
  invariant(network === "mainnet", "Solana chain is only supported on mainnet");
  return SOLANA_MAINNET;
}

export function getAllEvmChains(network: "mainnet" | "testnet"): Record<number, IEVMChain> {
  return network === "mainnet" ? EVM_MAINNET : EVM_TESTNET;
}

export function getChainType(chainId: number): ChainType {
  invariant(ALL_CHAINS[chainId], `Chain ${chainId} is not supported`);
  return ALL_CHAINS[chainId].type;
}

export function chainIdToPublicClient(chainId: number): PublicClient {
  invariant(EVM_CHAINS[chainId], `Chain ${chainId} is not an EVM chain`);

  return createPublicClient({
    chain: EVM_CHAINS[chainId].viem,
    transport: http(),
    pollingInterval: EVM_CHAINS[chainId].pollingInterval,
  });
}

export function chainIdToWalletClient(chainId: number, account?: Account): WalletClient<Transport, Chain> {
  invariant(EVM_CHAINS[chainId], `Chain ${chainId} is not an EVM chain`);

  return createWalletClient({
    chain: EVM_CHAINS[chainId].viem,
    transport: http(),
    account,
    pollingInterval: EVM_CHAINS[chainId].pollingInterval,
  });
}

export function getNativeRequired(chainId: number): bigint {
  invariant(ALL_CHAINS[chainId], `Chain ${chainId} is not supported`);
  return ALL_CHAINS[chainId].nativeRequired;
}

export function canDepositNative(chainId: number): boolean {
  invariant(ALL_CHAINS[chainId], `Chain ${chainId} is not supported`);
  return ALL_CHAINS[chainId].canDepositNative;
}

export function isMainnet(chainId: number): boolean {
  return EVM_MAINNET[chainId] !== undefined || RELAY_SOLANA_MAINNET_CHAIN_ID === chainId;
}

export function isTestnet(chainId: number): boolean {
  return EVM_TESTNET[chainId] !== undefined;
}

export function getDefaultToken(chainId: number): components["schemas"]["Token"] {
  invariant(ALL_CHAINS[chainId], `Chain ${chainId} is not supported`);
  return ALL_CHAINS[chainId].defaultToken;
}

export function getChainName(chainId: number): string {
  invariant(ALL_CHAINS[chainId], `Chain ${chainId} is not supported`);
  return EVM_CHAINS[chainId] ? EVM_CHAINS[chainId].viem.name : "Solana";
}

export function getPaymentUrl(address: string, amount: bigint, currency: string) {
  if (currency === "ETH") {
    return `ethereum:${address}?value=${amount.toString()}`;
  }
  return `ethereum:${address}`;
}

export function getExplorerTxUrl(chainId: number, txHash: string) {
  if (chainId === b3.id) {
    return "https://explorer.b3.fun/b3/tx/" + txHash;
  }
  if (EVM_CHAINS[chainId]) {
    return EVM_CHAINS[chainId].viem.blockExplorers?.default.url + "/tx/" + txHash;
  }
  return "https://solscan.io/tx/" + txHash;
}

export function getExplorerAddressUrl(chainId: number, address: string) {
  if (EVM_CHAINS[chainId]) {
    return EVM_CHAINS[chainId].viem.blockExplorers?.default.url + "/address/" + address;
  }
  return "https://solscan.io/account/" + address;
}

export function getMulticall3Address(chainId: number): string {
  const chainType = getChainType(chainId);
  invariant(chainType === ChainType.EVM, "chainType must be EVM");
  const multicall3 = EVM_CHAINS[chainId].viem.contracts?.multicall3;
  invariant(multicall3, `multicall3 of chain ${chainId} undefined`);
  return multicall3.address;
}

export function getNativeToken(chainId: number): components["schemas"]["Token"] {
  invariant(ALL_CHAINS[chainId], `Chain ${chainId} undefined`);
  return ALL_CHAINS[chainId].nativeToken;
}

export function isEvmChain(chainId: number): boolean {
  return Boolean(EVM_CHAINS[chainId]);
}
