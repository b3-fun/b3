"use client";

import { AnySpendDeposit } from "@b3dotfun/sdk/anyspend/react";
import { getHyperliquidUSDCToken, HYPERLIQUID_CHAIN_ID, normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
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

// ETH on Base
const ETH_BASE_TOKEN = {
  chainId: base.id,
  address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
  metadata: {
    logoURI: "https://assets.relay.link/icons/1/light.png",
  },
};

const STAKE_FOR_FUNCTION_ABI = JSON.stringify([
  {
    name: "stakeFor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
]);

// Example custom deposit contract (replace with your actual contract)
const STAKING_CONTRACT = "0xEf80AafFbf4cF5c8a5e1D4c61838987D5973DAab";

type DepositType = "simple" | "contract" | "hyperliquid" | "eth-base";

export function CustomDepositButton() {
  const { address = "0x0000000000000000000000000000000000000000" } = useAccountWallet();
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

  const customExactInConfig = {
    functionAbi: STAKE_FOR_FUNCTION_ABI,
    functionName: "stakeFor",
    functionArgs: [normalizeAddress(address), "{{amount_out}}"],
    to: STAKING_CONTRACT,
    spenderAddress: STAKING_CONTRACT,
    action: `stake USDC`,
  };

  return (
    <>
      <div className="space-y-4">
        <button
          onClick={() => handleOpenModal("contract")}
          className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Anyspend Deposit</h3>
            <p className="mt-1 text-sm text-gray-500">Demo with custom deposit contract configuration</p>
          </div>
          <span className="text-xs text-purple-500">With depositContractConfig</span>
        </button>

        <button
          onClick={() => handleOpenModal("hyperliquid")}
          className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-cyan-100 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Deposit to Hyperliquid</h3>
            <p className="mt-1 text-sm text-gray-500">Swap any token to USDC on Hyperliquid</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-700">Hyperliquid</span>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">USDC</span>
          </div>
        </button>

        <button
          onClick={() => handleOpenModal("eth-base")}
          className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Deposit ETH on Base</h3>
            <p className="mt-1 text-sm text-gray-500">Swap any token to ETH on Base</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Base</span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">ETH</span>
          </div>
        </button>
      </div>

      {/* Modal */}
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
            ) : depositType === "hyperliquid" ? (
              <AnySpendDeposit
                mode="modal"
                recipientAddress={address}
                destinationTokenAddress={getHyperliquidUSDCToken().address}
                destinationTokenChainId={HYPERLIQUID_CHAIN_ID}
                onSuccess={handleSuccess}
                onClose={handleClose}
                actionLabel="deposit to Hyperliquid"
                chainSelectionTitle="Deposit to Hyperliquid"
                chainSelectionDescription="Select a chain to swap any token to USDC on Hyperliquid"
              />
            ) : depositType === "eth-base" ? (
              <AnySpendDeposit
                mode="modal"
                recipientAddress={address}
                destinationTokenAddress={ETH_BASE_TOKEN.address}
                destinationTokenChainId={base.id}
                onSuccess={handleSuccess}
                onClose={handleClose}
                actionLabel="deposit ETH"
                chainSelectionTitle="Deposit ETH on Base"
                chainSelectionDescription="Swap any token to ETH on Base"
              />
            ) : (
              <AnySpendDeposit
                mode="modal"
                recipientAddress={address}
                destinationTokenAddress={USDC_TOKEN.address}
                destinationTokenChainId={base.id}
                onSuccess={handleSuccess}
                onClose={handleClose}
                depositContractConfig={customExactInConfig}
                actionLabel="deposit USDC"
                chainSelectionTitle="Deposit to Contract"
                chainSelectionDescription="Select a chain to swap and deposit to contract"
                isCustomDeposit={true}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
