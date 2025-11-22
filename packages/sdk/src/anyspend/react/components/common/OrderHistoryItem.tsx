import { ALL_CHAINS, getChainName, getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { Badge, useIsMobile } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { getVendorDisplayName } from "@b3dotfun/sdk/shared/utils/payment.utils";
import { ArrowRight, Coins, Image } from "lucide-react";
import TimeAgo from "react-timeago";

interface OrderHistoryItemProps {
  order: components["schemas"]["Order"];
  onSelectOrder?: (orderId: string) => void;
  mode: "modal" | "page";
}

export function OrderHistoryItem({ order, onSelectOrder, mode }: OrderHistoryItemProps) {
  const nft = order.type === "mint_nft" ? order.metadata.nft : undefined;
  const tournament =
    order.type === "join_tournament" || order.type === "fund_tournament" ? order.metadata.tournament : undefined;
  const dstToken = order.metadata.dstToken;
  const actualDstAmount = order.settlement?.actualDstAmount;
  const expectedDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? undefined
      : order.payload.expectedDstAmount;

  const { text: orderStatusText, status: orderDisplayStatus } = getStatusDisplay(order);

  const isSmallView = useIsMobile() || mode === "modal";

  // Check if this is a one-click payment order
  const isOneClickPayment = !!order.oneClickBuyUrl;
  const vendorName = order.onrampMetadata?.vendor ? getVendorDisplayName(order.onrampMetadata.vendor) : null;

  return (
    <div
      key={`anyspend-${order.id}`}
      className={cn(
        "font-inter border-as-border-secondary border-b py-5 font-medium transition-all last:border-b-0",
        onSelectOrder && "hover:bg-as-surface-secondary/50 cursor-pointer",
      )}
      onClick={() => onSelectOrder?.(order.id)}
    >
      {/* Header: Status and Time */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "text-xs",
              orderDisplayStatus === "processing" && "text-yellow-600",
              orderDisplayStatus === "success" && "text-green-600",
              orderDisplayStatus === "failure" && "text-red-600",
            )}
          >
            {orderStatusText}
          </div>
          {isOneClickPayment && vendorName && (
            <Badge variant="outline" className="text-as-secondary px-2 py-0.5 text-[10px]">
              {vendorName}
            </Badge>
          )}
        </div>
        <div className="text-as-secondary text-[10px] font-medium uppercase tracking-wide">
          <TimeAgo date={new Date(order.createdAt)} />
        </div>
      </div>

      {/* Main Content: From -> To */}
      <div className={cn("flex items-center", isSmallView ? "gap-2" : "gap-4")}>
        {/* From Section */}
        <div className={cn("flex min-w-0 flex-1 items-center", isSmallView ? "gap-1.5" : "gap-2")}>
          {order.metadata.srcToken.metadata.logoURI ? (
            <img
              src={order.metadata.srcToken.metadata.logoURI}
              alt={order.metadata.srcToken.symbol}
              className={cn("shrink-0 rounded-full", isSmallView ? "h-7 w-7" : "h-8 w-8")}
            />
          ) : (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-gray-200",
                isSmallView ? "h-7 w-7" : "h-8 w-8",
              )}
            >
              <Coins className={cn("text-gray-400", isSmallView ? "h-3.5 w-3.5" : "h-4 w-4")} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className={cn("text-as-primary truncate font-bold", isSmallView ? "text-xs" : "text-sm")}>
              {formatTokenAmount(BigInt(order.srcAmount), order.metadata.srcToken.decimals)}{" "}
              {order.metadata.srcToken.symbol}
            </div>
            <div className={cn("text-as-secondary flex items-center gap-1", isSmallView ? "text-[10px]" : "text-xs")}>
              <img src={ALL_CHAINS[order.srcChain]?.logoUrl} alt={getChainName(order.srcChain)} className="h-3 w-3" />
              <span className="truncate">{getChainName(order.srcChain)}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className={cn("text-as-secondary shrink-0 opacity-30", isSmallView ? "h-4 w-4" : "h-5 w-5")} />

        {/* To Section */}
        <div className={cn("flex min-w-0 flex-1 items-center", isSmallView ? "gap-1.5" : "gap-2")}>
          {nft ? (
            <>
              {nft.imageUrl ? (
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className={cn("shrink-0 rounded-full", isSmallView ? "h-7 w-7" : "h-8 w-8")}
                />
              ) : (
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full bg-gray-200",
                    isSmallView ? "h-7 w-7" : "h-8 w-8",
                  )}
                >
                  <Image className={cn("text-gray-400", isSmallView ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className={cn("text-as-primary truncate font-bold", isSmallView ? "text-xs" : "text-sm")}>
                  {nft.name}
                </div>
                <div
                  className={cn("text-as-secondary flex items-center gap-1", isSmallView ? "text-[10px]" : "text-xs")}
                >
                  <img
                    src={ALL_CHAINS[order.dstChain]?.logoUrl}
                    alt={getChainName(order.dstChain)}
                    className="h-3 w-3"
                  />
                  <span className="truncate">{getChainName(order.dstChain)}</span>
                </div>
              </div>
            </>
          ) : tournament ? (
            <>
              {tournament.imageUrl ? (
                <img
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  className={cn("shrink-0 rounded-full", isSmallView ? "h-7 w-7" : "h-8 w-8")}
                />
              ) : (
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full bg-gray-200",
                    isSmallView ? "h-7 w-7" : "h-8 w-8",
                  )}
                >
                  <Image className={cn("text-gray-400", isSmallView ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className={cn("text-as-primary truncate font-bold", isSmallView ? "text-xs" : "text-sm")}>
                  {tournament.name}
                </div>
                <div
                  className={cn("text-as-secondary flex items-center gap-1", isSmallView ? "text-[10px]" : "text-xs")}
                >
                  <img
                    src={ALL_CHAINS[order.dstChain]?.logoUrl}
                    alt={getChainName(order.dstChain)}
                    className="h-3 w-3"
                  />
                  <span className="truncate">{getChainName(order.dstChain)}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {dstToken.metadata.logoURI ? (
                <img
                  src={dstToken.metadata.logoURI}
                  alt={dstToken.symbol}
                  className={cn("shrink-0 rounded-full", isSmallView ? "h-7 w-7" : "h-8 w-8")}
                />
              ) : (
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full bg-gray-200",
                    isSmallView ? "h-7 w-7" : "h-8 w-8",
                  )}
                >
                  <Coins className={cn("text-gray-400", isSmallView ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className={cn("text-as-primary truncate font-bold", isSmallView ? "text-xs" : "text-sm")}>
                  {formatTokenAmount(
                    actualDstAmount
                      ? BigInt(actualDstAmount)
                      : expectedDstAmount
                        ? BigInt(expectedDstAmount)
                        : BigInt(0),
                    dstToken.decimals,
                  )}{" "}
                  {dstToken.symbol}
                </div>
                <div
                  className={cn("text-as-secondary flex items-center gap-1", isSmallView ? "text-[10px]" : "text-xs")}
                >
                  <img
                    src={ALL_CHAINS[order.dstChain]?.logoUrl}
                    alt={getChainName(order.dstChain)}
                    className="h-3 w-3"
                  />
                  <span className="truncate">{getChainName(order.dstChain)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
