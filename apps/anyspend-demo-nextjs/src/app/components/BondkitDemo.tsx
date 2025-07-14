import { AnySpendBondKit } from "@b3dotfun/sdk/anyspend/react/components";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

const bondKit_CONTRACT = "0x01ef4b21bb06fa40fe08e112a472b8925bb271d1";
const BASE_CHAIN_ID = 8453;

export function bondKitDemo() {
  const { address } = useAccountWallet();
  const [txHash, setTxHash] = useState<string>();

  if (!address) {
    return (
      <div className="flex min-h-[300px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-gray-500">Please connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">bondKit Demo</h2>
        <p className="text-sm text-gray-600">
          This demo shows how to use bondKit to buy tokens. The contract is deployed on Base network.
        </p>
      </div>

      {/* Example with 0.01 ETH */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-4 text-lg font-semibold">Buy 0.01 ETH worth of tokens</h3>
        <AnySpendBondKit
          type="anySpendBondKit"
          recipientAddress={address}
          contractAddress={bondKit_CONTRACT}
          tokenName="Demo bondKit Token"
          mode="modal"
          onSuccess={hash => setTxHash(hash)}
        />
      </div>

      {/* Example with 0.1 ETH */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-4 text-lg font-semibold">Buy 0.1 ETH worth of tokens</h3>
        <AnySpendBondKit
          type="anySpendBondKit"
          recipientAddress={address}
          contractAddress={bondKit_CONTRACT}
          tokenName="Demo bondKit Token"
          mode="modal"
          onSuccess={hash => setTxHash(hash)}
        />
      </div>

      {/* Transaction Status */}
      {txHash && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">
            Transaction submitted! Hash:{" "}
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {txHash}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
