import { base } from "viem/chains";
import { components } from "../types/api";

export const ANYSPEND_MAINNET_BASE_URL = process.env.NEXT_PUBLIC_ANYSPEND_BASE_URL || "https://mainnet.anyspend.com";

export const RELAY_ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
export const RELAY_SOL_ADDRESS = "11111111111111111111111111111111";

export const RELAY_SOLANA_MAINNET_CHAIN_ID = 792703809;

export const SOLANA_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const SOLANA_TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export const B3_TOKEN: components["schemas"]["Token"] = {
  chainId: base.id,
  address: "0xb3b32f9f8827d4634fe7d973fa1034ec9fddb3b3",
  decimals: 18,
  name: "B3",
  symbol: "B3",
  metadata: {
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/35690.png",
  },
};

export const ANYSPEND_TOKEN: components["schemas"]["Token"] = {
  chainId: base.id,
  address: "0xc17dda248e2d50fc006d8febb5a406dd31972712",
  decimals: 18,
  name: "Anyspend",
  symbol: "ANY",
  metadata: {
    logoURI: "https://cdn.b3.fun/anyspend_64x64.png",
  },
};

export const USDC_BASE: components["schemas"]["Token"] = {
  symbol: "USDC",
  chainId: base.id,
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  name: "USD Coin",
  decimals: 6,
  metadata: {
    logoURI: "https://polygonscan.com/token/images/usdc_32.png",
  },
};

export const ETH_BASE: components["schemas"]["Token"] = {
  symbol: "ETH",
  chainId: base.id,
  address: "0x0000000000000000000000000000000000000000",
  name: "Ethereum",
  decimals: 18,
  metadata: {
    logoURI: "https://polygonscan.com/token/images/eth_32.png",
  },
};

export const NFT_CONTRACTS: components["schemas"]["NftContract"][] = [
  {
    chainId: base.id,
    contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
    price: "500000000000000000",
    priceFormatted: "0.5",
    currency: B3_TOKEN,
    imageUrl:
      "https://storage.googleapis.com/nftimagebucket/base/tokens/0x80f0e6644723abb03aa8867d21e32bd854b2a2d9/preview/TVRjME1EUTRORFl4T0E9PV8zNjcy.jpg",
    name: "Downhill Ski",
    description: "Downhill Ski",
    tokenId: 0,
    type: "erc721",
  },
  {
    chainId: base.id,
    contractAddress: "0x8a19BA9A95F17D193bD751B80eF8B89b88E2856C",
    price: "400000000000000000000",
    priceFormatted: "400",
    currency: B3_TOKEN,
    imageUrl: "https://cdn.b3.fun/game-weapon-demo.png",
    name: "Eclipse Venom",
    description:
      "The Eclipse Venom's crystalline blade channels imprisoned astral toxins through swirling currents of violet and teal light, synchronizing with its wielder's heartbeat for strikes that bypass conventional armor. Wounds from this otherworldly weapon resist healing as victims describe being consumed from within by liquid darkness, their final moments filled with visions of infinite cosmic depths.",
    tokenId: null,
    type: "erc721",
  },
];

export const DEFAULT_NFT_CONTRACT = NFT_CONTRACTS[1];

export const STRIPE_CONFIG = {
  publishableKey:
    "pk_live_51QkrBwJnoDg53PsPq7QYOxSLfnXvtCVeD9UuyZ6c136i42XtYC2Z2bl1W5xbDg6AaoGyq63ErCc0yv3C2KBX29CG002AE862CP",
} as const;

export const PAYMENT_METHOD_ICONS = {
  visa: "https://github.com/marcovoliveira/react-svg-credit-card-payment-icons/raw/main/src/icons/flat-rounded/visa.svg",
  mastercard:
    "https://github.com/marcovoliveira/react-svg-credit-card-payment-icons/raw/main/src/icons/flat-rounded/mastercard.svg",
  amex: "https://github.com/marcovoliveira/react-svg-credit-card-payment-icons/raw/main/src/icons/flat-rounded/amex.svg",
  applePay: "https://github.com/Kimmax/react-payment-icons/raw/main/assets/card-icons/card_apple-pay.svg",
  googlePay: "https://github.com/Kimmax/react-payment-icons/raw/main/assets/card-icons/card_google-pay.svg",
  stripe:
    "https://raw.githubusercontent.com/stripe/stripe.github.io/455f506a628dc3f6c505e3001db45a64e29e9fc3/images/stripe-logo.svg",
} as const;

export const VENDOR_DISPLAY_NAMES = {
  coinbase: "Coinbase",
  stripe: "Stripe",
  unknown: "Unknown Vendor",
} as const;
