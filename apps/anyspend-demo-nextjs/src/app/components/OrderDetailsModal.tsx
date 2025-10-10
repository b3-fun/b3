"use client";

import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend/react";
import { Button, Dialog, DialogContent, Input } from "@b3dotfun/sdk/global-account/react";
import { OrderDetails } from "@b3dotfun/sdk/anyspend/react/components/common/OrderDetails";
import { CryptoPaymentMethodType } from "@b3dotfun/sdk/anyspend/react/components/common/CryptoPaymentMethod";
import { useState } from "react";
import { X } from "lucide-react";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ isOpen, onClose }: OrderDetailsModalProps) {
  const [orderId, setOrderId] = useState("");
  const [searchedOrderId, setSearchedOrderId] = useState<string | undefined>();
  const { orderAndTransactions: oat, isLoading } = useAnyspendOrderAndTransactions(searchedOrderId);

  const handleSearch = () => {
    if (orderId.trim()) {
      setSearchedOrderId(orderId.trim());
    }
  };

  const handleClear = () => {
    setOrderId("");
    setSearchedOrderId(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] p-0">
        <div className="relative">
          {/* Header */}
          <div className="border-b p-6 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!searchedOrderId ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Enter Order ID</label>
                  <Input
                    type="text"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="e.g., 26cb657a-e2fd-488a-a047-edee44946eb4"
                    className="w-full"
                  />
                </div>
                <Button onClick={handleSearch} disabled={!orderId.trim()} className="w-full">
                  View Order
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <div className="mb-2 text-lg font-medium">Loading order details...</div>
                  <div className="text-sm text-gray-500">Please wait</div>
                </div>
              </div>
            ) : oat ? (
              <div className="relative">
                <Button onClick={handleClear} variant="outline" className="mb-4 w-full">
                  ← Search Another Order
                </Button>
                <OrderDetails
                  mode="modal"
                  order={oat.data.order}
                  depositTxs={oat.data.depositTxs}
                  relayTxs={oat.data.relayTxs}
                  executeTx={oat.data.executeTx}
                  refundTxs={oat.data.refundTxs}
                  selectedCryptoPaymentMethod={CryptoPaymentMethodType.NONE}
                  points={oat.data.points}
                />
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
                <div className="text-center">
                  <div className="mb-2 text-lg font-medium text-red-600">Order not found</div>
                  <div className="text-sm text-gray-500">Please check the order ID and try again</div>
                </div>
                <Button onClick={handleClear} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
