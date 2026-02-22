"use client";

import { B3_TOKEN, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import {
  ArrowLeftRight,
  Clock,
  Coins,
  CreditCard,
  Download,
  Eye,
  Fuel,
  Image,
  Lock,
  Moon,
  Package,
  Receipt,
  RotateCw,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Swords,
  TrendingUp,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseUnits } from "viem";
import { base } from "viem/chains";
import { useTheme } from "./ThemeContext";

const DEMO_RECIPIENT = "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4";
const DEMO_CONTRACT = "0xbf04200be3cbf371467a539706393c81c470f523";
const DEMO_NFT_CONTRACT = "0xe04074c294d0Db90F0ffBC60fa61b48672C91965";

interface DemoCard {
  title: string;
  description: string;
  icon: LucideIcon;
  tag?: string;
  onClick: () => void;
}

interface DemoSection {
  title: string;
  cards: DemoCard[];
}

export default function HomePage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  const openModal = (contentType: Parameters<typeof setB3ModalContentType>[0]) => {
    setB3ModalOpen(true);
    setB3ModalContentType(contentType);
  };

  const isDark = theme === "dark";

  const sections: DemoSection[] = [
    {
      title: "Swap & Buy",
      cards: [
        {
          title: "Swap Tokens",
          icon: ArrowLeftRight,
          description: "Cross-chain swap between any supported tokens",
          onClick: () => openModal({ type: "anySpend" }),
        },
        {
          title: "Buy with Fiat",
          icon: CreditCard,
          description: "Purchase crypto with credit card via Stripe",
          tag: "fiat",
          onClick: () => openModal({ type: "anySpend", defaultActiveTab: "fiat" }),
        },
        {
          title: "Get B3 Token",
          icon: Coins,
          description: "Swap any token to B3 with preset destination",
          onClick: () =>
            openModal({
              type: "anySpend",
              destinationTokenAddress: B3_TOKEN.address,
              destinationTokenChainId: B3_TOKEN.chainId,
            }),
        },
      ],
    },
    {
      title: "Checkout",
      cards: [
        {
          title: "Checkout Page",
          icon: ShoppingCart,
          description: "Full-page Shopify-style two-column layout",
          tag: "page",
          onClick: () => router.push("/checkout"),
        },
        {
          title: "Checkout Modal",
          icon: ShoppingBag,
          description: "Modal checkout with line items and cart",
          tag: "modal",
          onClick: () =>
            openModal({
              type: "anySpendCheckoutTrigger",
              recipientAddress: DEMO_RECIPIENT,
              destinationTokenAddress: B3_TOKEN.address,
              destinationTokenChainId: B3_TOKEN.chainId,
              items: [
                {
                  id: "item-1",
                  name: "B3kemon Starter Pack",
                  description: "3 random B3kemon creatures",
                  imageUrl: "https://cdn.b3.fun/b3kemon-card.png",
                  amount: parseUnits("100", 18).toString(),
                  quantity: 1,
                },
                {
                  id: "item-2",
                  name: "Rare Pokeball",
                  description: "Increases catch rate by 2x",
                  amount: parseUnits("50", 18).toString(),
                  quantity: 2,
                },
              ],
              organizationName: "B3kemon Shop",
              organizationLogo: "https://cdn.b3.fun/b3kemon-card.png",
              buttonText: "Pay Now",
              workflowId: "demo-workflow-1",
              orgId: "demo-org-1",
              callbackMetadata: { inputs: { source: "demo-nextjs" } },
              onSuccess: result => console.log("Checkout success:", result),
              onError: error => console.error("Checkout error:", error),
            }),
        },
        {
          title: "Checkout (No Items)",
          icon: Receipt,
          description: "Total-only payment panel, no line items",
          tag: "modal",
          onClick: () =>
            openModal({
              type: "anySpendCheckoutTrigger",
              recipientAddress: DEMO_RECIPIENT,
              destinationTokenAddress: USDC_BASE.address,
              destinationTokenChainId: USDC_BASE.chainId,
              totalAmount: parseUnits("2", 6).toString(),
              organizationName: "B3kemon Shop",
              organizationLogo: "https://cdn.b3.fun/b3kemon-card.png",
              buttonText: "Pay Now",
              workflowId: "demo-workflow-1",
              orgId: "demo-org-1",
              onSuccess: result => console.log("Checkout success:", result),
              onError: error => console.error("Checkout error:", error),
            }),
        },
      ],
    },
    {
      title: "NFT & Collectibles",
      cards: [
        {
          title: "Mint B3kemon NFT",
          icon: Image,
          description: "ERC-1155 NFT mint with AnySpend payment",
          onClick: () => {
            const randomTokenId = Math.floor(Math.random() * 7);
            openModal({
              type: "anySpendNft",
              nftContract: {
                chainId: base.id,
                contractAddress: DEMO_NFT_CONTRACT,
                price: "1990000",
                priceFormatted: "1.99",
                currency: USDC_BASE,
                imageUrl: "https://cdn.b3.fun/b3kemon-card.png",
                name: "Mystery B3kemon",
                description: "Summon a mysterious B3kemon creature!",
                tokenId: randomTokenId,
                type: "erc1155",
              },
              recipientAddress: DEMO_RECIPIENT,
            });
          },
        },
        {
          title: "BondKit Purchase",
          icon: TrendingUp,
          description: "Buy bonding-curve tokens via BondKit contract",
          onClick: () =>
            openModal({
              type: "anySpendBondKit",
              recipientAddress: DEMO_RECIPIENT,
              contractAddress: DEMO_CONTRACT,
              tokenName: "DEMO",
              imageUrl: "https://cdn.b3.fun/b3-coin-3d.png",
              b3Amount: parseUnits("10", 18).toString(),
              onSuccess: txHash => console.log("BondKit success:", txHash),
            }),
        },
      ],
    },
    {
      title: "Deposits",
      cards: [
        {
          title: "Deposit",
          icon: Download,
          description: "Flexible deposit with chain selection and payment options",
          onClick: () =>
            openModal({
              type: "anySpendDeposit",
              recipientAddress: DEMO_RECIPIENT,
              destinationTokenAddress: B3_TOKEN.address,
              destinationTokenChainId: B3_TOKEN.chainId,
              onSuccess: amount => console.log("Deposit success:", amount),
            }),
        },
      ],
    },
    {
      title: "Utilities",
      cards: [
        {
          title: "Gas Funding",
          icon: Fuel,
          description: "Fund wallets with gas on any chain",
          tag: "page",
          onClick: () => router.push("/gas-funding"),
        },
        {
          title: "Onramp Builder",
          icon: Wrench,
          description: "Configure and generate onramp payment URLs",
          tag: "page",
          onClick: () => router.push("/onramp-example"),
        },
        {
          title: "Order History",
          icon: Clock,
          description: "View past AnySpend orders and transactions",
          onClick: () => openModal({ type: "anySpendOrderHistory" }),
        },
        {
          title: "State Preview",
          icon: Eye,
          description: "Toggle success, error, and loading states",
          tag: "debug",
          onClick: () => router.push("/preview"),
        },
      ],
    },
    {
      title: "Custom Widgets",
      cards: [
        {
          title: "Stake B3",
          icon: Lock,
          description: "Stake B3 tokens with optional swap-and-stake",
          onClick: () =>
            openModal({
              type: "anySpendStakeB3",
              recipientAddress: DEMO_RECIPIENT,
              onSuccess: () => console.log("Stake B3 success"),
            }),
        },
        {
          title: "Stake B3 (Exact In)",
          icon: Lock,
          description: "Swap exact input amount and stake as B3",
          tag: "exact in",
          onClick: () =>
            openModal({
              type: "anySpendStakeB3ExactIn",
              recipientAddress: DEMO_RECIPIENT,
              onSuccess: () => console.log("Stake B3 exact-in success"),
            }),
        },
        {
          title: "Collector Club Pack",
          icon: Package,
          description: "Purchase collector packs from vending machine",
          onClick: () =>
            openModal({
              type: "anySpendCollectorClubPurchase",
              packId: 1,
              packAmount: 1,
              pricePerPack: parseUnits("5", 6).toString(),
              recipientAddress: DEMO_RECIPIENT,
              vendingMachineId: "demo-vm-1",
              packType: "standard",
              onSuccess: txHash => console.log("Collector Club success:", txHash),
            }),
        },
        {
          title: "Stake Upside",
          icon: TrendingUp,
          description: "Stake tokens with upside exposure via staking contract",
          onClick: () =>
            openModal({
              type: "anySpendStakeUpside",
              beneficiaryAddress: DEMO_RECIPIENT,
              stakeAmount: parseUnits("100", 18).toString(),
              stakingContractAddress: DEMO_CONTRACT,
              token: B3_TOKEN,
              onSuccess: () => console.log("Stake Upside success"),
            }),
        },
        {
          title: "Stake Upside (Exact In)",
          icon: TrendingUp,
          description: "Swap exact input and stake with upside exposure",
          tag: "exact in",
          onClick: () =>
            openModal({
              type: "anySpendStakeUpsideExactIn",
              recipientAddress: DEMO_RECIPIENT,
              stakingContractAddress: DEMO_CONTRACT,
              token: B3_TOKEN,
              onSuccess: () => console.log("Stake Upside exact-in success"),
            }),
        },
        {
          title: "Deposit Upside",
          icon: Download,
          description: "Deposit tokens with upside via deposit contract",
          onClick: () =>
            openModal({
              type: "anySpendDepositUpside",
              recipientAddress: DEMO_RECIPIENT,
              depositContractAddress: DEMO_CONTRACT,
              token: B3_TOKEN,
              onSuccess: () => console.log("Deposit Upside success"),
            }),
        },
        {
          title: "Deposit Hype",
          icon: Zap,
          description: "Deposit with custom branding and payment options",
          onClick: () =>
            openModal({
              type: "anySpendDepositHype",
              recipientAddress: DEMO_RECIPIENT,
              onSuccess: amount => console.log("Deposit Hype success:", amount),
            }),
        },
        {
          title: "Buy Spin",
          icon: RotateCw,
          description: "Purchase spins for on-chain spin wheel game",
          onClick: () =>
            openModal({
              type: "anySpendBuySpin",
              spinwheelContractAddress: DEMO_CONTRACT,
              chainId: base.id,
              recipientAddress: DEMO_RECIPIENT,
              onSuccess: txHash => console.log("Buy Spin success:", txHash),
            }),
        },
        {
          title: "Join Tournament",
          icon: Swords,
          description: "Pay entry fee to join an on-chain tournament",
          onClick: () =>
            openModal({
              type: "anySpendJoinTournament",
              joinFor: DEMO_RECIPIENT,
              tournamentChainId: base.id,
              tournamentContractAddress: DEMO_CONTRACT,
              tournamentMetadata: { name: "B3 Championship", id: "t-1" } as any,
              tournamentEntryToken: B3_TOKEN,
              tournamentEntryFee: parseUnits("10", 18).toString(),
              onSuccess: () => console.log("Join Tournament success"),
            }),
        },
        {
          title: "Fund Tournament",
          icon: Trophy,
          description: "Fund an on-chain tournament prize pool",
          onClick: () =>
            openModal({
              type: "anySpendFundTournament",
              tournamentChainId: base.id,
              tournamentContractAddress: DEMO_CONTRACT,
              tournamentMetadata: { name: "B3 Championship", id: "t-1" } as any,
              tournamentFundToken: B3_TOKEN,
              tournamentFundAmount: parseUnits("100", 18).toString(),
              onSuccess: () => console.log("Fund Tournament success"),
            }),
        },
      ],
    },
  ];

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        background: isDark ? "#0B0F1A" : "#F8F9FB",
        backgroundImage: isDark
          ? "radial-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px)"
          : "radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <header
        className="px-6 py-5 transition-colors"
        style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-5">
            <img
              src={
                isDark
                  ? "https://cdn.b3.fun/anyspend/anyspend-logo-alt.svg"
                  : "https://cdn.b3.fun/anyspend-logo-brand.svg"
              }
              alt="AnySpend"
              className="h-6"
            />
            <div
              className="h-5"
              style={{ width: 1, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
            />
            <div>
              <h1 className="text-sm font-semibold tracking-tight" style={{ color: isDark ? "#fff" : "#111827" }}>
                Widget Lab
              </h1>
              <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)" }}>
                {sections.reduce((acc, s) => acc + s.cards.length, 0)} demos &middot; {sections.length} categories
              </p>
            </div>
          </div>

          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-8">
          {sections.map(section => (
            <section key={section.title}>
              <div className="mb-3 flex items-center gap-3">
                <h2
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}
                >
                  {section.title}
                </h2>
                <div
                  className="h-px flex-1"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)" }}
                />
                <span
                  className="font-mono text-[10px]"
                  style={{ color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)" }}
                >
                  {section.cards.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.cards.map(card => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      onClick={card.onClick}
                      className="group relative flex items-start gap-3.5 rounded-xl px-5 py-5 text-left transition-all duration-200"
                      style={{
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
                        background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.4)";
                        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.03)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
                        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "#fff";
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                        }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        {card.tag && (
                          <span
                            className="absolute right-4 top-4 rounded-full px-2 py-0.5 font-mono text-[10px]"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                              color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)",
                            }}
                          >
                            {card.tag}
                          </span>
                        )}
                        <h3
                          className="text-[13px] font-medium leading-snug"
                          style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#111827" }}
                        >
                          {card.title}
                        </h3>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)" }}
                        >
                          {card.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
