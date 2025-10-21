import { RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend/constants";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
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
import { abstract, arbitrum, avalanche, b3, base, bsc, mainnet, optimism, polygon } from "viem/chains";
import { ChainType, IBaseChain, IEVMChain, ISolanaChain } from "../types/chain";
import { getAvaxToken, getBnbToken, getEthToken, getPolToken, getSolanaToken } from "./token";

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
    wethAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  [arbitrum.id]: {
    id: arbitrum.id,
    name: "Arbitrum",
    type: ChainType.EVM,
    logoUrl: "https://assets.relay.link/icons/square/42161/light.png",
    nativeRequired: parseEther("0.0003"),
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
    wethAddress: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
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
    wethAddress: "0x4200000000000000000000000000000000000006",
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
    wethAddress: "0x4200000000000000000000000000000000000006",
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
    coingeckoName: "polygon_pos",
    wethAddress: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  },
  [avalanche.id]: {
    id: avalanche.id,
    name: avalanche.name,
    logoUrl: "https://assets.relay.link/icons/square/43114/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.01"),
    canDepositNative: true,
    defaultToken: getAvaxToken(),
    nativeToken: getAvaxToken(),
    viem: getCustomEvmChain(avalanche, "https://avalanche-c-chain-rpc.publicnode.com"),
    pollingInterval: 1000, // 1 second for Avalanche
    zapperEnum: "AVALANCHE_MAINNET",
    coingeckoName: "avax",
    wethAddress: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
  },
  [bsc.id]: {
    id: bsc.id,
    name: bsc.name,
    logoUrl: "https://avatars.githubusercontent.com/u/45615063?s=280&v=4",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.0001"),
    canDepositNative: true,
    defaultToken: getBnbToken(),
    nativeToken: getBnbToken(),
    viem: getCustomEvmChain(
      bsc,
      "https://methodical-divine-flower.bsc.quiknode.pro/9fc7efd3c34cc016cceacc27ee95850629b7cd21/",
    ),
    pollingInterval: 1000, // 1 second for BSC
    zapperEnum: "BSC_MAINNET",
    coingeckoName: "bsc",
    wethAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
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
    wethAddress: "0x4200000000000000000000000000000000000006",
  },
  [abstract.id]: {
    id: abstract.id,
    name: abstract.name,
    logoUrl: "https://assets.relay.link/icons/square/2741/light.png",
    type: ChainType.EVM,
    nativeRequired: parseEther("0.0001"),
    canDepositNative: true,
    defaultToken: getEthToken(abstract.id),
    nativeToken: getEthToken(abstract.id),
    viem: getCustomEvmChain(
      abstract,
      "https://cosmopolitan-nameless-mountain.abstract-mainnet.quiknode.pro/863853304b986b582bdacf625ce3350397c560f8/",
    ),
    pollingInterval: 3000, // 3 seconds for Abstract
    zapperEnum: "ABSTRACT_MAINNET",
    coingeckoName: "abstract",
    wethAddress: "0x3439153eb7af838ad19d56e1571fbd09333c2809",
  },
};

export const EVM_TESTNET: Record<number, IEVMChain> = {
  // [sepolia.id]: {
  //   id: sepolia.id,
  //   name: sepolia.name,
  //   logoUrl: "https://assets.relay.link/icons/square/1/light.png",
  //   type: ChainType.EVM,
  //   nativeRequired: parseEther("0.00001"),
  //   canDepositNative: true,
  //   defaultToken: getEthToken(sepolia.id),
  //   nativeToken: getEthToken(sepolia.id),
  //   viem: sepolia,
  //   pollingInterval: 1000, // 1 second for Sepolia
  //   coingeckoName: "sepolia-testnet",
  // },
  // [baseSepolia.id]: {
  //   id: baseSepolia.id,
  //   name: baseSepolia.name,
  //   logoUrl: "https://assets.relay.link/icons/square/8453/light.png",
  //   type: ChainType.EVM,
  //   nativeRequired: parseEther("0.00001"),
  //   canDepositNative: true,
  //   defaultToken: getEthToken(baseSepolia.id),
  //   nativeToken: getEthToken(baseSepolia.id),
  //   viem: baseSepolia,
  //   pollingInterval: 1000, // 1 second for Base Sepolia
  //   coingeckoName: null,
  // },
  // [b3Sepolia.id]: {
  //   id: b3Sepolia.id,
  //   name: b3Sepolia.name,
  //   logoUrl: "https://assets.relay.link/icons/square/8333/light.png",
  //   type: ChainType.EVM,
  //   nativeRequired: parseEther("0.00001"),
  //   canDepositNative: true,
  //   defaultToken: getEthToken(b3Sepolia.id),
  //   nativeToken: getEthToken(b3Sepolia.id),
  //   viem: b3Sepolia,
  //   pollingInterval: 1000, // 1 second for B3 Sepolia
  //   coingeckoName: null,
  // },
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
  coingeckoName: "solana",
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

export function getCoingeckoName(chainId: number): string | null {
  invariant(ALL_CHAINS[chainId], `Chain ${chainId} is not supported`);
  return ALL_CHAINS[chainId].coingeckoName;
}

export function getPaymentUrl(address: string, amount: bigint, currency: string, chainId: number, decimals?: number) {
  // Get chain type to determine URL format
  const chainType = getChainType(chainId);
  const chain = ALL_CHAINS[chainId];
  invariant(chain, `Chain ${chainId} is not supported`);

  switch (chainType) {
    case ChainType.EVM: {
      // For EVM chains, follow EIP-681 format
      // Format: ethereum:[address]@[chainId]?value=[amount]&symbol=[symbol]
      const params = new URLSearchParams();

      // Add value for native token transfers
      if (currency === chain.nativeToken.symbol) {
        params.append("value", amount.toString());
      }

      // Handle token transfers differently from native transfers
      if (currency !== chain.nativeToken.symbol) {
        // For ERC20 tokens, the issue is that mobile wallets often ignore chainId
        // and default to mainnet when they see ethereum: scheme
        // Let's try a different approach: put chainId first and be very explicit

        const tokenParams = new URLSearchParams();

        // Put chainId first to make it more prominent
        if (chainId !== mainnet.id) {
          tokenParams.append("chainId", chainId.toString());
        }

        // For ERC20 tokens, convert from smallest unit to display units using decimals
        // For example: 2400623 (raw) with 6 decimals becomes "2.400623"
        let displayAmount: string;
        if (decimals !== undefined && currency !== chain.nativeToken.symbol) {
          // Convert from smallest unit to display unit for ERC20 tokens
          const divisor = BigInt(10 ** decimals);
          const wholePart = amount / divisor;
          const fractionalPart = amount % divisor;

          if (fractionalPart === BigInt(0)) {
            displayAmount = wholePart.toString();
          } else {
            // Format fractional part with leading zeros if needed
            const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
            // Remove trailing zeros
            const trimmedFractional = fractionalStr.replace(/0+$/, "");
            displayAmount = trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
          }
        } else {
          // For native tokens or when decimals not provided, use raw amount
          displayAmount = amount.toString();
        }

        tokenParams.append("amount", displayAmount);
        tokenParams.append("address", address); // recipient address

        // For Arbitrum and other L2s, try a more explicit format
        if (chainId !== mainnet.id) {
          // Include the token contract address in the path more explicitly
          const url = `ethereum:${currency}@${chainId}?${tokenParams.toString()}`;
          return url;
        } else {
          // Mainnet tokens
          const url = `ethereum:${currency}?${tokenParams.toString()}`;
          return url;
        }
      }

      // For native ETH transfers:
      if (chainId !== mainnet.id) {
        // For non-mainnet chains, use the same explicit format as tokens
        // to make sure wallets recognize the correct chain
        const nativeParams = new URLSearchParams();
        nativeParams.append("chainId", chainId.toString());
        nativeParams.append("value", amount.toString());
        const url = `ethereum:${address}@${chainId}?${nativeParams.toString()}`;
        return url;
      } else {
        // For mainnet, use the simple format
        const queryString = params.toString();
        const url = `ethereum:${address}${queryString ? `?${queryString}` : ""}`;
        return url;
      }
    }

    case ChainType.SOLANA: {
      // Solana URL format for Phantom and other mobile wallets
      const params = new URLSearchParams();

      // Check if this is native SOL or SPL token
      // The address "11111111111111111111111111111111" is Solana's System Program, indicating native SOL
      const isNativeSOL =
        currency === chain.nativeToken.symbol || currency === "SOL" || currency === "11111111111111111111111111111111";

      if (isNativeSOL) {
        // Native SOL transfers - convert from lamports to SOL
        let displayAmount: string;
        if (decimals !== undefined) {
          const divisor = BigInt(10 ** decimals);
          const wholePart = amount / divisor;
          const fractionalPart = amount % divisor;

          if (fractionalPart === BigInt(0)) {
            displayAmount = wholePart.toString();
          } else {
            const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
            const trimmedFractional = fractionalStr.replace(/0+$/, "");
            displayAmount = trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
          }
        } else {
          // Fallback: assume SOL has 9 decimals
          const divisor = BigInt(1000000000); // 1e9
          const wholePart = amount / divisor;
          const fractionalPart = amount % divisor;

          if (fractionalPart === BigInt(0)) {
            displayAmount = wholePart.toString();
          } else {
            const fractionalStr = fractionalPart.toString().padStart(9, "0");
            const trimmedFractional = fractionalStr.replace(/0+$/, "");
            displayAmount = trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
          }
        }

        // For native SOL, use simple format without spl-token parameter
        params.append("amount", displayAmount);
      } else {
        // SPL token transfers
        let displayAmount: string;
        if (decimals !== undefined) {
          const divisor = BigInt(10 ** decimals);
          const wholePart = amount / divisor;
          const fractionalPart = amount % divisor;

          if (fractionalPart === BigInt(0)) {
            displayAmount = wholePart.toString();
          } else {
            const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
            const trimmedFractional = fractionalStr.replace(/0+$/, "");
            displayAmount = trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
          }
        } else {
          displayAmount = amount.toString();
        }

        params.append("amount", displayAmount);
        params.append("spl-token", currency); // token mint address
      }

      const url = `solana:${address}?${params.toString()}`;
      console.log("Solana URL (isNativeSOL:", isNativeSOL, "):", url);
      return url;
    }

    default:
      // Fallback to just the address if chain type is unknown
      return address;
  }
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
