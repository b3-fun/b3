"use client";

import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { ArrowLeftRight, Coins, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DemoCard {
  title: string;
  description: string;
  icon: LucideIcon;
  tag?: string;
  onClick: () => void;
}

export default function FarcasterPage() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  const openModal = (contentType: Parameters<typeof setB3ModalContentType>[0]) => {
    setB3ModalOpen(true);
    setB3ModalContentType(contentType);
  };

  const cards: DemoCard[] = [
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
  ];

  return (
    <div
      className="min-h-screen bg-[#F8F9FB]"
      style={{
        backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <header className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-5">
          <img src="https://cdn.b3.fun/anyspend-logo-brand.svg" alt="AnySpend" className="h-6" />
          <div className="h-5" style={{ width: 1, background: "rgba(0,0,0,0.1)" }} />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-gray-900">Farcaster Demo</h1>
            <p className="text-[11px] text-black/40">Swap &amp; Buy</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/35">Swap &amp; Buy</h2>
          <div className="h-px flex-1 bg-black/[0.06]" />
          <span className="font-mono text-[10px] text-black/20">{cards.length}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={card.onClick}
                className="group relative flex items-start gap-3.5 rounded-xl border border-black/[0.08] bg-white px-5 py-5 text-left transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/[0.03]"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04]">
                  <Icon className="h-4 w-4 text-black/40" />
                </div>
                <div className="flex flex-col gap-1">
                  {card.tag && (
                    <span className="absolute right-4 top-4 rounded-full bg-black/[0.05] px-2 py-0.5 font-mono text-[10px] text-black/40">
                      {card.tag}
                    </span>
                  )}
                  <h3 className="text-[13px] font-medium leading-snug text-gray-900">{card.title}</h3>
                  <p className="text-xs leading-relaxed text-black/45">{card.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
