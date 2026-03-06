import { Chain } from "thirdweb";
import { createWallet, SingleStepAuthArgsType, Wallet } from "thirdweb/wallets";

type WalletType = Wallet["id"];
type StrategyType = SingleStepAuthArgsType["strategy"];
type CustomStrategyType = "basement" | "privy";

type AllowedStrategies = StrategyType | WalletType | CustomStrategyType | "email";
type NonWalletStrategyType = Exclude<AllowedStrategies, WalletType>;
const customStrategies = ["basement", "privy"] as const;
// type CustomStrategy = (typeof customStrategies)[number];

export const allowedStrategies = [
  // Auth strategies
  "apple",
  "google",
  "github",
  "x",
  "discord",
  "email",
  "guest",

  // Wallet IDs
  "walletConnect",
  "io.metamask",
  "com.coinbase.wallet",

  // Custom strategies
  // TODO: Audit we don't use "privy" directly anymore
  ...customStrategies,
] as const;

export type AllowedStrategy = (typeof allowedStrategies)[number];

export function isWalletType(strategy: AllowedStrategies): strategy is WalletType {
  // Check if it's a known wallet ID pattern (com.*, io.*, etc.)
  const walletIdPattern = /^(com\.|io\.|app\.|xyz\.|me\.|org\.|pro\.)/;
  return strategy === "walletConnect" || walletIdPattern.test(strategy);
}

export function isStrategyType(strategy: AllowedStrategies): strategy is NonWalletStrategyType {
  return !isWalletType(strategy);
}

export function getConnectOptionsFromStrategy(strategy: AllowedStrategy): {
  strategy: StrategyType;
  wallet?: Wallet;
  chain?: Chain; // required for SIWE, which we do custom atm
} {
  if (!allowedStrategies.includes(strategy)) {
    throw new Error(`Invalid strategy: ${strategy}`);
  }

  if (strategy === "email") {
    throw new Error("Email strategy requires OTP flow and cannot be connected in a single step");
  }

  if (isWalletType(strategy)) {
    return { strategy: "wallet" as const, wallet: createWallet(strategy) };
  } else {
    // @ts-expect-error we have custom strategies too
    return { strategy };
  }
}

export const strategyIcons: Record<string, string> = {
  google: "https://cdn.b3.fun/google.svg",
  x: "https://cdn.b3.fun/x.svg?1",
  discord: "https://cdn.b3.fun/discord.svg",
  apple: "https://cdn.b3.fun/apple.svg",
  guest: "https://cdn.b3.fun/incognito.svg",
  // Add more strategies as needed
};

export const strategyLabels: Record<string, string> = {
  google: "Google",
  x: "X",
  discord: "Discord",
  apple: "Apple",
  guest: "Guest",
  github: "GitHub",
  email: "Email",
};
// Test it
// console.log(getConnectOptionsFromStrategy("io.metamask"));
// console.log(getConnectOptionsFromStrategy("google"));
