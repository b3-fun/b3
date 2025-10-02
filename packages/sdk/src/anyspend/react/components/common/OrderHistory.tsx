"use client";

import { useAnyspendOrderHistory } from "@b3dotfun/sdk/anyspend/react";
import { Button, Skeleton, useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { OrderHistoryItem } from "./OrderHistoryItem";

interface OrderHistoryProps {
  mode: "modal" | "page";
  onBack: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export function OrderHistory({ mode, onBack, onSelectOrder }: OrderHistoryProps) {
  const { address } = useAccountWallet();
  const { orderHistory, isLoadingOrderHistory, refetchOrderHistory } = useAnyspendOrderHistory(address);

  return (
    <>
      <div className="mb-8 flex w-full items-center gap-3">
        <Button onClick={onBack} variant="ghost" size="icon" className="hover:bg-as-surface-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h3 className="text-as-primary text-2xl font-bold">Order History</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-as-surface-secondary"
          onClick={() => {
            refetchOrderHistory();
          }}
        >
          <RefreshCcw className="text-as-secondary hover:text-as-primary h-5 w-5 cursor-pointer transition-all hover:rotate-180" />
        </Button>
      </div>

      {isLoadingOrderHistory ? (
        <div className="w-full space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
          ))}
        </div>
      ) : !orderHistory?.length ? (
        <div className="bg-as-surface-secondary w-full rounded-2xl p-12 text-center">
          <p className="text-as-secondary text-sm">No order history found</p>
        </div>
      ) : (
        <div className="mb-12 w-full space-y-3">
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
