"use client";

import { B3_TOKEN, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import { OrderStatus } from "@b3dotfun/sdk/anyspend/react/components";
import { CheckoutSuccess } from "@b3dotfun/sdk/anyspend/react/components/checkout/CheckoutSuccess";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { StyleRoot } from "@b3dotfun/sdk/global-account/react";
import { Circle, Moon, RotateCcw, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "../ThemeContext";

const ORDER_STATUSES = [
  "scanning_deposit_transaction",
  "waiting_stripe_payment",
  "expired",
  "sending_token_from_vault",
  "quoting_after_deposit",
  "relay",
  "executing",
  "executed",
  "refunding",
  "refunded",
  "failure",
] as const;

type OrderStatus_ = (typeof ORDER_STATUSES)[number];

const ORDER_TYPES = ["swap", "mint_nft", "custom", "custom_exact_in", "join_tournament", "fund_tournament"] as const;
type OrderType = (typeof ORDER_TYPES)[number];

const STATUS_META: Record<OrderStatus_, { label: string; kind: "pending" | "success" | "error" }> = {
  scanning_deposit_transaction: { label: "Scanning Deposit", kind: "pending" },
  waiting_stripe_payment: { label: "Waiting Stripe", kind: "pending" },
  expired: { label: "Expired", kind: "error" },
  sending_token_from_vault: { label: "Sending Token", kind: "pending" },
  quoting_after_deposit: { label: "Quoting", kind: "pending" },
  relay: { label: "Relay", kind: "pending" },
  executing: { label: "Executing", kind: "pending" },
  executed: { label: "Executed", kind: "success" },
  refunding: { label: "Refunding", kind: "pending" },
  refunded: { label: "Refunded", kind: "error" },
  failure: { label: "Failure", kind: "error" },
};

const KIND_COLORS = {
  pending: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  success: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
  error: "bg-red-500/20 text-red-400 ring-red-500/30",
};

const STATUS_DOT_COLORS = {
  pending: { active: "text-amber-400", idle: "" },
  success: { active: "text-emerald-400", idle: "" },
  error: { active: "text-red-400", idle: "" },
};

const STATUS_GROUPS: { kind: "pending" | "success" | "error"; label: string; statuses: OrderStatus_[] }[] = [
  {
    kind: "pending",
    label: "In Progress",
    statuses: ["scanning_deposit_transaction", "waiting_stripe_payment", "sending_token_from_vault", "quoting_after_deposit", "relay", "executing", "refunding"],
  },
  { kind: "success", label: "Completed", statuses: ["executed"] },
  { kind: "error", label: "Failed", statuses: ["expired", "refunded", "failure"] },
];

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  swap: "Swap",
  mint_nft: "Mint NFT",
  custom: "Custom",
  custom_exact_in: "Custom (Exact In)",
  join_tournament: "Join Tournament",
  fund_tournament: "Fund Tournament",
};

function buildMockOrder(status: OrderStatus_, type: OrderType): components["schemas"]["Order"] {
  const baseOrder = {
    id: "preview-00000000-0000-0000-0000-000000000000",
    recipientAddress: "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4",
    globalAddress: "0xa640beaa78eeb64bb269f2baf8202b9a7316e123",
    srcChain: 8453,
    dstChain: 8453,
    srcTokenAddress: USDC_BASE.address,
    dstTokenAddress: B3_TOKEN.address,
    srcAmount: "5000000",
    status,
    errorDetails: status === "failure" ? "SLIPPAGE" : null,
    createdAt: Date.now() - 60000,
    expiredAt: Date.now() + 600000,
    filledAt: status === "executed" ? Date.now() : null,
    receivedDepositAt: null,
    creatorAddress: "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4",
    partnerId: null,
    onrampMetadata: null,
    oneClickBuyUrl: null,
    stripePaymentIntentId: null,
    settlement:
      status === "executed" ? { actualDstAmount: "250000000000000000000" } : { actualDstAmount: undefined },
  };

  const metadata = { srcToken: USDC_BASE, dstToken: B3_TOKEN };

  if (type === "swap") {
    return { ...baseOrder, type: "swap", payload: { amount: "250000000000000000000" }, metadata } as any;
  }
  if (type === "mint_nft") {
    return {
      ...baseOrder,
      type: "mint_nft",
      payload: { contractAddress: "0xe04074c294d0Db90F0ffBC60fa61b48672C91965", tokenId: "1", amount: "1990000" },
      metadata: { ...metadata, nft: { name: "Mystery B3kemon", image: "https://cdn.b3.fun/b3kemon-card.png" } },
    } as any;
  }
  if (type === "custom" || type === "custom_exact_in") {
    return {
      ...baseOrder,
      type,
      payload: {
        contractAddress: "0xbf04200be3cbf371467a539706393c81c470f523",
        encodedData: "0x",
        amount: "250000000000000000000",
      },
      metadata: { ...metadata, action: "stake B3" },
    } as any;
  }
  if (type === "join_tournament") {
    return {
      ...baseOrder,
      type: "join_tournament",
      payload: { contractAddress: "0x0000000000000000000000000000000000000000", amount: "250000000000000000000" },
      metadata: { ...metadata, tournament: { name: "B3 Championship", id: "t-1" } },
    } as any;
  }
  return {
    ...baseOrder,
    type: "fund_tournament",
    payload: { contractAddress: "0x0000000000000000000000000000000000000000", amount: "250000000000000000000" },
    metadata: { ...metadata, tournament: { name: "B3 Championship", id: "t-1" } },
  } as any;
}

export default function StatePreviewPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus_>("executed");
  const [selectedType, setSelectedType] = useState<OrderType>("swap");
  const [selectedWidget, setSelectedWidget] = useState<"order-status" | "checkout-success">("order-status");
  const [replayKey, setReplayKey] = useState(0);

  const mockOrder = buildMockOrder(selectedStatus, selectedType);
  const replay = () => setReplayKey(k => k + 1);

  const bg = isDark ? "#0B0F1A" : "#F8F9FB";
  const dots = isDark ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.04)";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const surface = isDark ? "rgba(255,255,255,0.03)" : "#fff";
  const textPrimary = isDark ? "#fff" : "#111827";
  const textMuted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)";
  const textDim = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.25)";

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        background: bg,
        backgroundImage: `radial-gradient(${dots} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <header className="px-6 py-6" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ border: `1px solid ${border}`, color: textMuted }}
            >
              &larr; Back
            </button>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: textPrimary }}>State Preview</h1>
              <p className="text-xs" style={{ color: textMuted }}>
                Toggle widget states to preview success, error, and loading UI
              </p>
            </div>
          </div>
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <div
            className="flex flex-col gap-0 overflow-hidden rounded-xl"
            style={{ border: `1px solid ${border}`, background: surface }}
          >
            <div className="flex" style={{ borderBottom: `1px solid ${border}` }}>
              {(
                [
                  ["order-status", "OrderStatus"],
                  ["checkout-success", "CheckoutSuccess"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedWidget(key)}
                  className="flex-1 py-3 text-xs font-medium transition-all"
                  style={{
                    color: selectedWidget === key ? (isDark ? "#fff" : "#111827") : textMuted,
                    background: selectedWidget === key ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)") : "transparent",
                    borderBottom: selectedWidget === key ? "2px solid #3b82f6" : "2px solid transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {selectedWidget === "order-status" && (
              <>
                <div className="px-4 pt-4 pb-3">
                  <label className="mb-2.5 block text-[10px] font-semibold uppercase tracking-widest" style={{ color: textMuted }}>
                    Order Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ORDER_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all"
                        style={{
                          background: selectedType === type
                            ? (isDark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.08)")
                            : "transparent",
                          border: `1px solid ${selectedType === type ? (isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.25)") : "transparent"}`,
                          color: selectedType === type ? (isDark ? "#93bbfc" : "#2563eb") : (isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"),
                        }}
                      >
                        <span
                          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
                          style={{
                            border: `1.5px solid ${selectedType === type ? "#3b82f6" : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)")}`,
                          }}
                        >
                          {selectedType === type && (
                            <span className="block h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </span>
                        {ORDER_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: 1, background: border }} />

                <div className="px-4 pt-3 pb-4">
                  <label className="mb-2.5 block text-[10px] font-semibold uppercase tracking-widest" style={{ color: textMuted }}>
                    Status
                  </label>
                  <div className="flex flex-col gap-3">
                    {STATUS_GROUPS.map(group => (
                      <div key={group.kind}>
                        <div className="mb-1 flex items-center gap-2 px-1">
                          <span
                            className="block h-1.5 w-1.5 rounded-full"
                            style={{
                              background: group.kind === "pending" ? "#f59e0b" : group.kind === "success" ? "#10b981" : "#ef4444",
                            }}
                          />
                          <span className="text-[10px] font-medium" style={{ color: textMuted }}>
                            {group.label}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {group.statuses.map(status => {
                            const { label } = STATUS_META[status];
                            const isSelected = selectedStatus === status;
                            return (
                              <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-left transition-all"
                                style={{
                                  background: isSelected
                                    ? (isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)")
                                    : "transparent",
                                  border: `1px solid ${isSelected ? (isDark ? "rgba(59,130,246,0.25)" : "rgba(59,130,246,0.2)") : "transparent"}`,
                                }}
                              >
                                <Circle
                                  className={`h-2 w-2 shrink-0 ${isSelected ? STATUS_DOT_COLORS[group.kind].active : ""}`}
                                  style={{
                                    color: isSelected
                                      ? undefined
                                      : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"),
                                  }}
                                  fill={isSelected ? "currentColor" : "none"}
                                  strokeWidth={isSelected ? 0 : 1.5}
                                />
                                <span
                                  className="text-xs"
                                  style={{
                                    color: isSelected
                                      ? (isDark ? "#fff" : "#111827")
                                      : (isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)"),
                                    fontWeight: isSelected ? 500 : 400,
                                  }}
                                >
                                  {label}
                                </span>
                                <span
                                  className="ml-auto font-mono text-[10px]"
                                  style={{
                                    color: isSelected
                                      ? (isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)")
                                      : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)"),
                                  }}
                                >
                                  {status.replace(/_/g, " ")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedWidget === "checkout-success" && (
              <div className="flex flex-1 items-center justify-center px-4 py-8">
                <p className="text-center text-xs" style={{ color: textMuted }}>
                  No configuration needed.
                  <br />
                  Use the replay button to re-trigger the animation.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${border}`, background: surface }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${border}` }}>
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: textDim }}>
                  {selectedWidget === "order-status"
                    ? `${selectedType} / ${selectedStatus}`
                    : "checkout-success"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={replay}
                    className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}
                    title="Replay animations"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                      selectedWidget === "checkout-success"
                        ? KIND_COLORS.success
                        : KIND_COLORS[STATUS_META[selectedStatus].kind]
                    }`}
                  >
                    {selectedWidget === "checkout-success" ? "success" : STATUS_META[selectedStatus].kind}
                  </span>
                </div>
              </div>

              <div className="flex min-h-[320px] items-center justify-center p-8">
                <StyleRoot>
                  {selectedWidget === "order-status" ? (
                    <OrderStatus key={`${selectedStatus}-${selectedType}-${replayKey}`} order={mockOrder} />
                  ) : (
                    <CheckoutSuccess
                      key={`checkout-success-${replayKey}`}
                      txHash="0xabc123def456789012345678901234567890abcdef1234567890abcdef123456"
                      orderId="preview-00000000-0000-0000-0000-000000000000"
                      returnUrl="/"
                      returnLabel="Return to Demo"
                    />
                  )}
                </StyleRoot>
              </div>
            </div>

            {selectedWidget === "order-status" && (
              <div className="rounded-lg px-4 py-3" style={{ border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                <p className="font-mono text-[11px]" style={{ color: textDim }}>
                  mock: {selectedType} &middot; 5 USDC &rarr; 250 B3 &middot; status:{" "}
                  <code className="rounded px-1.5 py-0.5" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: textMuted }}>
                    {selectedStatus}
                  </code>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
