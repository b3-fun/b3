import { ALL_CHAINS, getChainName, getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { Badge, Button, useIsMobile } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { ArrowRight, ChevronDown } from "lucide-react";
import TimeAgo from "react-timeago";
import { b3 } from "viem/chains";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

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
  const actualDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? undefined
      : order.payload.actualDstAmount;
  const expectedDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? undefined
      : order.payload.expectedDstAmount;

  const { text: orderStatusText, status: orderDisplayStatus } = getStatusDisplay(order);

  const isSmallView = useIsMobile() || mode === "modal";

  return (
    <div
      key={`anyspend-${order.id}`}
      className={cn(
        "bg-as-light-brand/20 rounded-lg border p-4",
        onSelectOrder && "hover:bg-as-light-brand/30 hover:border-as-brand cursor-pointer transition-colors",
      )}
      onClick={() => onSelectOrder?.(order.id)}
    >
      <div className="flex items-center justify-between">
        <Badge
          className={cn(
            "px-3 py-1 text-xs",
            orderDisplayStatus === "processing" && "bg-yellow-500/10 text-yellow-500",
            orderDisplayStatus === "success" && "bg-green-500/10 text-green-500",
            orderDisplayStatus === "failure" && "bg-red-500/10 text-red-500",
          )}
        >
          {orderStatusText}
        </Badge>

        <div className="flex items-center gap-2">
          <span className="text-nano label-style text-as-primary/30">
            <TimeAgo date={new Date(order.createdAt)} />
          </span>
        </div>
      </div>

      {order.oneClickBuyUrl ? (
        <div className="mb-3 mt-4 flex items-center gap-1">
          <div className="bg-b3-react-background flex flex-1 flex-col gap-1 rounded-lg border p-4 px-5">
            <h3 className="text-as-primary/50 flex items-center gap-2 text-xl font-semibold">
              <span>
                {"Buy "}
                <span className="text-as-primary">
                  ${formatTokenAmount(BigInt(order.srcAmount), order.metadata.srcToken.decimals)}
                </span>
                {` of`}
              </span>

              <span className="text-as-primary flex items-center gap-2">
                {nft ? (
                  <img src={nft.imageUrl} alt={nft.name} className="h-6 w-6" />
                ) : tournament ? (
                  <img src={tournament.imageUrl} alt={tournament.name} className="h-6 w-6" />
                ) : (
                  <img src={dstToken.metadata.logoURI} alt={dstToken.symbol} className="h-6 w-6" />
                )}
                {nft ? nft.name : tournament ? tournament.name : dstToken.symbol}
              </span>

              <span className="flex items-center gap-2">
                {` on `}
                <span className="text-as-primary flex items-center gap-2">
                  <img src={ALL_CHAINS[order.dstChain]?.logoUrl} alt={getChainName(order.dstChain)} className="h-4" />
                  {order.dstChain !== b3.id && getChainName(order.dstChain)}
                </span>
              </span>
            </h3>

            <p className="label-style text-as-primary/30 mt-1 flex items-center gap-2 text-xs">
              Paying via{" "}
              <img src="https://cdn.b3.fun/coinbase-wordmark-blue.svg" alt="Coinbase" className="-mt-1 h-3" />
            </p>
          </div>
        </div>
      ) : (
        <div className={cn("mb-3 mt-4 flex items-center gap-1", isSmallView && "flex-col")}>
          <div className="bg-b3-react-background flex w-full flex-1 flex-col gap-1 overflow-hidden rounded-lg border p-4 px-5">
            <div className="flex items-center gap-2">
              <img
                src={order.metadata.srcToken.metadata.logoURI}
                alt={order.metadata.srcToken.symbol}
                className="h-6 w-6 rounded-full"
              />
              <div className="text-as-primary flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold">
                {formatTokenAmount(BigInt(order.srcAmount), order.metadata.srcToken.decimals)}{" "}
                {order.metadata.srcToken.symbol}
              </div>
            </div>

            <div className="label-style text-as-primary/50 flex items-center gap-2 text-sm">
              from
              <img
                src={ALL_CHAINS[order.srcChain]?.logoUrl}
                alt={getChainName(order.srcChain)}
                className={cn("h-4", order.srcChain !== b3.id && "w-4 rounded-full", order.srcChain === b3.id && "h-3")}
              />
              {getChainName(order.srcChain)}
            </div>
          </div>

          <div className={cn("h-8 w-8 shrink-0 -rotate-90 opacity-30", isSmallView && "rotate-0")}>
            <ChevronDown className="h-8 w-8" />
          </div>

          <div className="bg-b3-react-background flex w-full flex-1 flex-col gap-1 overflow-hidden rounded-lg border p-4 px-5">
            <div className="flex items-center gap-2">
              {nft ? (
                <>
                  <img src={nft.imageUrl} alt={nft.name} className="h-6 w-6 rounded-full" />
                  <div className="text-as-primary overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold">
                    {nft.name}
                  </div>
                </>
              ) : tournament ? (
                <>
                  <img src={tournament.imageUrl} alt={tournament.name} className="h-6 w-6 rounded-full" />
                  <div className="text-as-primary overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold">
                    {tournament.name}
                  </div>
                </>
              ) : (
                <>
                  <img src={dstToken.metadata.logoURI} alt={dstToken.symbol} className="h-6 w-6 rounded-full" />
                  <div className="text-as-primary overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold">
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
                </>
              )}
            </div>
            <div className="label-style text-as-primary/50 flex items-center gap-2 text-sm">
              to
              <img
                src={ALL_CHAINS[order.dstChain]?.logoUrl}
                alt={getChainName(order.dstChain)}
                className={cn("h-4", order.dstChain !== b3.id && "w-4 rounded-full", order.dstChain === b3.id && "h-3")}
              />
              {getChainName(order.dstChain)}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button variant="link" size="sm" className="h-auto" onClick={() => onSelectOrder?.(order.id)}>
          {orderDisplayStatus === "processing" ? "Proceed with payment" : "Details"}{" "}
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
