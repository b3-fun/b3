"use client";

import { ALL_CHAINS, capitalizeFirstLetter, getChainName } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { CopyToClipboard } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { ChevronDown, Copy } from "lucide-react";
import { motion } from "motion/react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { b3 } from "viem/chains";

type Order = components["schemas"]["Order"];
type Token = components["schemas"]["Token"];
type Tournament = components["schemas"]["Tournament"];
type NFT = components["schemas"]["NFT"];

interface OrderDetailsCollapsibleProps {
  order: Order;
  dstToken: Token;
  tournament?: Tournament;
  nft?: NFT;
  recipientName?: string;
  formattedExpectedDstAmount?: string;
  className?: string;
  showTotal?: boolean;
  totalAmount?: string;
  points?: number;
}

export const OrderDetailsCollapsible = memo(function OrderDetailsCollapsible({
  order,
  dstToken,
  tournament,
  nft,
  recipientName,
  formattedExpectedDstAmount,
  className,
  showTotal = false,
  totalAmount,
  points,
}: OrderDetailsCollapsibleProps) {
  const [showOrderDetails, setShowOrderDetails] = useState(true);

  // Calculate expected amount if not provided
  const expectedDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? "0"
      : order.payload.expectedDstAmount.toString();

  const finalFormattedExpectedDstAmount =
    formattedExpectedDstAmount || formatTokenAmount(BigInt(expectedDstAmount), dstToken.decimals);

  return (
    <div
      className={cn(
        "order-details-collapsible bg-as-surface-secondary border-as-border-secondary rounded-xl border px-4 py-2",
        className,
      )}
    >
      {showOrderDetails ? (
        <motion.div
          className="order-details-expanded w-full"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
        >
          <div className="order-details-content flex w-full flex-col items-center gap-3 whitespace-nowrap py-2 text-sm">
            {/* Recipient Section */}
            <div className="order-details-recipient-section flex w-full justify-between gap-4">
              <div className="order-details-recipient-label text-as-tertiarry">Recipient</div>
              <div className="order-details-recipient-info flex flex-col items-end gap-1">
                {recipientName && (
                  <div className="order-details-recipient-name text-as-primary font-semibold">{recipientName}</div>
                )}
                <CopyToClipboard
                  text={order.recipientAddress}
                  onCopy={() => {
                    toast.success("Copied recipient address to clipboard");
                  }}
                >
                  <div className="order-details-recipient-address text-as-primary flex items-center gap-2">
                    {centerTruncate(order.recipientAddress, 10)}
                    <Copy className="order-details-recipient-copy-icon text-as-primary/50 hover:text-as-primary h-4 w-4 cursor-pointer transition-all duration-200" />
                  </div>
                </CopyToClipboard>
              </div>
            </div>
            <div className="order-details-divider divider w-full" />

            {/* Expected Amount/Action Section */}
            <div className="order-details-expected-section flex w-full items-center justify-between gap-2">
              <div className="order-details-expected-label text-as-tertiarry">
                {order.type === "swap" || order.type === "mint_nft" || order.type === "hype_duel"
                  ? "Expected to receive"
                  : order.type === "join_tournament"
                    ? "Join tournament"
                    : order.type === "fund_tournament"
                      ? "Fund tournament"
                      : order.type === "custom" || order.type === "custom_exact_in"
                        ? order.metadata.action
                          ? capitalizeFirstLetter(order.metadata.action)
                          : "Contract execution"
                        : ""}
              </div>

              <div className="order-details-expected-value flex items-end gap-2">
                {order.type === "swap" ? (
                  `~${finalFormattedExpectedDstAmount} ${dstToken.symbol}`
                ) : order.type === "mint_nft" ? (
                  <div className="order-details-nft-info flex items-center gap-2">
                    <img src={nft?.imageUrl} alt={nft?.name || "NFT"} className="order-details-nft-image h-5 w-5" />
                    <div className="order-details-nft-name">{nft?.name || "NFT"}</div>
                  </div>
                ) : order.type === "join_tournament" || order.type === "fund_tournament" ? (
                  <div className="order-details-tournament-info flex items-center gap-2">
                    <img
                      src={tournament?.imageUrl}
                      alt={tournament?.name || "Tournament"}
                      className="order-details-tournament-image h-5 w-5"
                    />
                    <div className="order-details-tournament-name">{tournament?.name || "Tournament"}</div>
                  </div>
                ) : order.type === "hype_duel" ? (
                  <div className="order-details-hype-info flex items-center gap-2">
                    <div className="order-details-hype-amount">
                      {formatTokenAmount(BigInt(order.payload.expectedDstAmount), dstToken.decimals)} HYPE
                    </div>
                  </div>
                ) : null}

                <div className="order-details-chain-info text-as-primary/50 flex items-center gap-2">
                  <span className="order-details-chain-text">
                    on {order.dstChain !== b3.id && getChainName(order.dstChain)}
                  </span>
                  <img
                    src={ALL_CHAINS[order.dstChain].logoUrl}
                    alt={getChainName(order.dstChain)}
                    className={cn(
                      "order-details-chain-logo h-3",
                      order.dstChain !== b3.id && "w-3 rounded-full",
                      order.dstChain === b3.id && "h-4",
                    )}
                  />
                </div>
              </div>
            </div>

            {points !== undefined && points !== null && (
              <>
                <div className="order-details-divider divider w-full" />
                {/* Points Section */}
                <div className="order-details-points-section flex w-full justify-between gap-4">
                  <div className="order-details-points-label text-as-tertiarry">Points</div>
                  <div className="order-details-points-value text-as-brand font-semibold">
                    +{formatNumber(points)} pts
                  </div>
                </div>
              </>
            )}

            <div className="order-details-divider divider w-full" />

            {/* Order ID / Total Section */}
            <div className="order-details-id-total-section flex w-full justify-between gap-4">
              <div className="order-details-id-total-label text-as-tertiarry">
                {showTotal ? "Total (included fee)" : "Order ID"}
              </div>
              <div className="order-details-id-total-value text-as-primary overflow-hidden text-ellipsis whitespace-nowrap">
                {showTotal && totalAmount ? totalAmount : order.id}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="order-details-collapsed flex w-full items-center">
          <div className="order-details-collapsed-divider divider w-full" />
          <button
            className="order-details-collapsed-button whitespace-nowrap text-sm"
            onClick={() => setShowOrderDetails(true)}
          >
            Order Details
          </button>
          <ChevronDown className="order-details-collapsed-chevron text-as-primary mx-1 h-4 min-h-4 w-4 min-w-4" />
          <div className="order-details-collapsed-divider divider w-full" />
        </div>
      )}
    </div>
  );
});
