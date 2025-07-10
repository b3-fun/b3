"use client";

import { useAnyspendOrderHistory } from "@b3dotfun/sdk/anyspend/react";
import { Button, Skeleton, useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { OrderHistoryItem } from "./OrderHistoryItem";

const isMainnet = true;

interface OrderHistoryProps {
  mode: "modal" | "page";
  onBack: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export function OrderHistory({ mode, onBack, onSelectOrder }: OrderHistoryProps) {
  const { address } = useAccountWallet();
  const { orderHistory, isLoadingOrderHistory, refetchOrderHistory } = useAnyspendOrderHistory(isMainnet, address);

  return (
    <>
      <div className="mb-6 flex w-full items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">Order History</h3>
          <p className="text-as-primary/30 text-sm">View your past transactions</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            refetchOrderHistory();
          }}
        >
          <RefreshCcw className="text-as-primary/30 hover:text-as-primary h-4 w-4 cursor-pointer transition-all hover:rotate-180" />
        </Button>
      </div>

      {isLoadingOrderHistory ? (
        <div className="w-full space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
          ))}
        </div>
      ) : !orderHistory?.length ? (
        <div className="bg-as-light-brand w-full rounded-lg border p-8 text-center">
          <p className="text-b3-react-muted-foreground">No order history found</p>
        </div>
      ) : (
        <div className="mb-12 w-full space-y-4">
          {[...orderHistory]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(order => (
              <OrderHistoryItem key={order.id} order={order} onSelectOrder={onSelectOrder} mode={mode} />
            ))}
        </div>
      )}
    </>
  );
}
