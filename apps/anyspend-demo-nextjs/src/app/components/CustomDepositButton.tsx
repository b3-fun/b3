"use client";

import { AnySpendDeposit } from "@b3dotfun/sdk/anyspend/react";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";
import { base } from "viem/chains";

// Example token configuration - USDC on Base
const USDC_TOKEN = {
  chainId: base.id,
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  metadata: {
    logoURI: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
  },
};

// Example custom deposit contract (replace with your actual contract)
const EXAMPLE_DEPOSIT_CONTRACT = "0x0000000000000000000000000000000000000000";

type DepositType = "simple" | "contract";

export function CustomDepositButton() {
  const { address } = useAccountWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositType, setDepositType] = useState<DepositType>("simple");

  const handleOpenModal = (type: DepositType) => {
    setDepositType(type);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (amount: string) => {
    console.log(`Deposit successful! Amount: ${amount}`);
    handleClose();
  };

  return (
    <>
      <div className="space-y-4">
        <button
          onClick={() => handleOpenModal("simple")}
          className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Custom Deposit (Simple)</h3>
            <p className="mt-1 text-sm text-gray-500">Demo of AnySpendDeposit component with chain selection</p>
          </div>
          <span className="text-xs text-indigo-500">Shows balances sorted by value</span>
        </button>

        <button
          onClick={() => handleOpenModal("contract")}
          className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Custom Deposit (Contract)</h3>
            <p className="mt-1 text-sm text-gray-500">Demo with custom deposit contract configuration</p>
          </div>
          <span className="text-xs text-purple-500">With depositContractConfig</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Close button */}
            <button onClick={handleClose} className="absolute right-4 top-4 z-[100] text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!address ? (
              <div className="p-6">
                <div className="rounded-lg bg-yellow-50 p-4 text-center">
                  <p className="text-yellow-800">Please sign in first to use the deposit feature.</p>
                </div>
              </div>
            ) : depositType === "simple" ? (
              <AnySpendDeposit
                mode="modal"
                recipientAddress={address}
                destinationToken={USDC_TOKEN}
                destinationChainId={base.id}
                onSuccess={handleSuccess}
                minDestinationAmount={0.1}
                chainSelectionTitle="Deposit USDC"
                chainSelectionDescription="Select a chain to swap tokens from"
              />
            ) : (
              <AnySpendDeposit
                mode="modal"
                recipientAddress={address}
                destinationToken={USDC_TOKEN}
                destinationChainId={base.id}
                onSuccess={handleSuccess}
                depositContractConfig={{
                  contractAddress: EXAMPLE_DEPOSIT_CONTRACT,
                  functionName: "depositFor",
                }}
                actionLabel="deposit USDC"
                chainSelectionTitle="Deposit to Contract"
                chainSelectionDescription="Select a chain to swap and deposit to contract"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
