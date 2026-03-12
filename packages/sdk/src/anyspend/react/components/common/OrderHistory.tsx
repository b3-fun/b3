"use client";

import { useAnyspendOrderHistory } from "@b3dotfun/sdk/anyspend/react";
import { Button, Skeleton, useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import ModalHeader from "@b3dotfun/sdk/global-account/react/components/ModalHeader/ModalHeader";
import { RefreshCcw } from "lucide-react";
import { OrderHistoryItem } from "./OrderHistoryItem";

interface OrderHistoryProps {
  mode: "modal" | "page";
  onBack?: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export function OrderHistory({ mode, onBack, onSelectOrder }: OrderHistoryProps) {
  const { connectedEOAWallet, address: smartWalletAddress } = useAccountWallet();
  const address = connectedEOAWallet?.getAccount()?.address || smartWalletAddress;
  const { orderHistory, isLoadingOrderHistory, refetchOrderHistory } = useAnyspendOrderHistory(address);

  return (
    <>
      <ModalHeader title="Order History" showCloseButton={false} handleBack={onBack} className="w-full bg-transparent">
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
      </ModalHeader>

      {isLoadingOrderHistory ? (
        <div className="w-full space-y-3 px-5">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
          ))}
        </div>
      ) : !orderHistory?.length ? (
        <div className="bg-as-surface-secondary w-full rounded-2xl p-12 px-5 text-center">
          <p className="text-as-secondary text-sm">No order history found</p>
        </div>
      ) : (
        <div className="mb-12 w-full px-5 pt-5">
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
