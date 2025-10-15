"use client";

import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";

const ETH_STAKING_CONTRACT = "0x0ad863101f152741b3c74f9Cf189Dc2bb6B934D2";
const B3_STAKING_CONTRACT = "0x45B77Ee35E9F1b2Ee14263B06aB8C2C5d9716287";
const B3_TOKEN_ADDRESS = "0xB3B32F9f8827D4634fE7d973Fa1034Ec9fdDB3B3";

export function StakeUpsideButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const currentWallet = useAccountWallet();

  const handleStake = (tokenType: "ETH" | "B3") => {
    const isB3 = tokenType === "B3";

    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "anySpendStakeUpside",
      beneficiaryAddress: currentWallet.address || "",
      stakeAmount: isB3 ? "50000000000000000000" : "10000000000000", // 50 B3 or 0.00001 ETH (18 decimals)
      stakingContractAddress: isB3 ? B3_STAKING_CONTRACT : ETH_STAKING_CONTRACT,
      token: {
        chainId: 8453, // Base
        address: isB3 ? B3_TOKEN_ADDRESS : "0x0000000000000000000000000000000000000000",
        symbol: isB3 ? "B3" : "ETH",
        name: isB3 ? "B3" : "Ethereum",
        decimals: 18,
        metadata: {
          logoURI: isB3 ? "https://cdn.b3.fun/b3-logo.png" : "https://cdn.b3.fun/eth-logo.png",
        },
      },
    });
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handleStake("ETH")}
        className="group flex h-40 flex-1 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Stake ETH</h3>
          <p className="mt-1 text-sm text-gray-500">Swap any token and stake ETH with Upside</p>
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
