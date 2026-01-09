"use client";

import { AnySpendOrderlyDeposit } from "@b3dotfun/sdk/anyspend/react";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

// Demo broker ID - replace with your actual broker ID from Orderly
const DEMO_BROKER_ID = "volt";

export function AnySpendOrderlyDepositButton() {
  const { address } = useAccountWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (amount: string) => {
    console.log("Orderly deposit successful! Amount:", amount);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-green-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">AnySpend + Orderly</h3>
          <p className="mt-1 text-sm text-gray-500">Deposit any token to Orderly on Arbitrum</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Any token</span>
          <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">Arbitrum</span>
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-lg">
            {/* AnySpend Orderly Deposit Component */}
            {address ? (
              <AnySpendOrderlyDeposit
                brokerId={DEMO_BROKER_ID}
                mode="page"
                onSuccess={handleSuccess}
                onClose={handleCloseModal}
                minAmount={1}
              />
            ) : (
              <div className="rounded-lg bg-white p-6 text-center shadow-xl">
                <p className="text-sm text-gray-500">Connect wallet to deposit</p>
                <button
                  onClick={handleCloseModal}
                  className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
