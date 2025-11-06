"use client";

import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";

const WETH_STAKING_CONTRACT = "0x693AcB2B5de276235bd1b5C2D911b0bC1947Ee9b";
const B3_STAKING_CONTRACT = "0x45B77Ee35E9F1b2Ee14263B06aB8C2C5d9716287";
const B3_TOKEN_ADDRESS = "0xB3B32F9f8827D4634fE7d973Fa1034Ec9fdDB3B3";
const WETH_TOKEN_ADDRESS = "0x4200000000000000000000000000000000000006";

export function StakeUpsideButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const currentWallet = useAccountWallet();

  const handleStake = (tokenType: "WETH" | "B3") => {
    const isB3 = tokenType === "B3";

    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "anySpendStakeUpside",
      beneficiaryAddress: currentWallet.address || "",
      stakeAmount: isB3 ? "50000000000000000000" : "10000000000000", // 50 B3 or 0.00001 ETH (18 decimals)
      stakingContractAddress: isB3 ? B3_STAKING_CONTRACT : WETH_STAKING_CONTRACT,
      token: {
        chainId: 8453, // Base
        address: isB3 ? B3_TOKEN_ADDRESS : (WETH_TOKEN_ADDRESS as `0x${string}`),
        symbol: isB3 ? "B3" : "WETH",
        name: isB3 ? "B3" : "Wrapped Ethereum",
        decimals: 18,
        metadata: {
          logoURI: isB3
            ? "https://assets.coingecko.com/coins/images/54287/standard/B3.png?1739001374"
            : "https://assets.coingecko.com/coins/images/2518/standard/weth.png?1696503332",
        },
      },
    });
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handleStake("WETH")}
        className="group flex h-40 flex-1 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Stake WETH</h3>
          <p className="mt-1 text-sm text-gray-500">Swap any token and stake WETH with Upside</p>
        </div>
      </button>

      <button
        onClick={() => handleStake("B3")}
        className="group flex h-40 flex-1 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Stake B3</h3>
          <p className="mt-1 text-sm text-gray-500">Swap any token and stake B3 with Upside</p>
        </div>
      </button>
    </div>
  );
}
