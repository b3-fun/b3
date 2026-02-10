"use client";

import { AnySpendDeposit } from "@b3dotfun/sdk/anyspend/react";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";
import { parseUnits } from "viem";
import { base } from "viem/chains";

// USDC on Base (6 decimals)
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export function FixedAmountDepositButton() {
  const { address = "0x0000000000000000000000000000000000000000" } = useAccountWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => setIsModalOpen(false);

  const handleSuccess = (amount: string) => {
    console.log(`Fixed amount deposit successful! Amount: ${amount}`);
    handleClose();
  };

  // Fixed amount: 10 USDC (in wei/smallest unit)
  const fixedAmount = parseUnits("10", 6).toString();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-green-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Fixed Amount Deposit</h3>
          <p className="mt-1 text-sm text-gray-500">Deposit exactly 10 USDC with locked amount inputs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Fixed Amount</span>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">10 USDC</span>
        </div>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-xl">
            {!address ? (
              <div className="relative p-6">
                <button onClick={handleClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="rounded-lg bg-yellow-50 p-4 text-center">
                  <p className="text-yellow-800">Please sign in first to use the deposit feature.</p>
                </div>
              </div>
            ) : (
              <AnySpendDeposit
                mode="modal"
                recipientAddress={address}
                destinationTokenAddress={USDC_ADDRESS}
                destinationTokenChainId={base.id}
                destinationTokenAmount={fixedAmount}
                onSuccess={handleSuccess}
                onClose={handleClose}
                allowDirectTransfer
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
