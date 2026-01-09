"use client";

import { OrderlyDeposit } from "@b3dotfun/sdk/anyspend/react";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

// Demo broker ID - replace with your actual broker ID from Orderly
const DEMO_BROKER_ID = "volt";

// Available chains for the demo
const DEMO_CHAINS = [
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 8453, name: "Base" },
  { id: 1, name: "Ethereum" },
  { id: 137, name: "Polygon" },
];

export function OrderlyDepositButton() {
  const { address } = useAccountWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState(42161);
  const [amount, setAmount] = useState("10");

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (txHash: string) => {
    console.log("Orderly deposit successful!", txHash);
    // Optionally close modal after success
    // setIsModalOpen(false);
  };

  const handleError = (error: Error) => {
    console.error("Orderly deposit failed:", error);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Orderly Deposit</h3>
          <p className="mt-1 text-sm text-gray-500">Deposit USDC to Orderly Network vault (omnichain)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">16 chains supported</span>
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Orderly Deposit</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chain selector */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Chain</label>
              <select
                value={selectedChainId}
                onChange={e => setSelectedChainId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {DEMO_CHAINS.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount input */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount (USDC)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="mt-2 flex gap-2">
                {["10", "50", "100", "500"].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`flex-1 rounded border px-2 py-1 text-sm ${
                      amount === val
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-300 text-gray-600 hover:border-purple-300"
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Orderly Deposit Component */}
            {address ? (
              <OrderlyDeposit
                brokerId={DEMO_BROKER_ID}
                chainId={selectedChainId}
                amount={amount}
                onSuccess={handleSuccess}
                onError={handleError}
                showFeeBreakdown={true}
              />
            ) : (
              <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-500">
                Connect wallet to deposit
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
