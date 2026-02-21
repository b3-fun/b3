import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import { base } from "viem/chains";
import { AnySpendCustomExactIn } from "./AnySpendCustomExactIn";

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

export function AnySpendStakeUpsideExactIn({
  loadOrder,
  mode = "modal",
  recipientAddress,
  sourceTokenAddress,
  sourceTokenChainId,
  destinationTokenAmount,
  stakingContractAddress,
  token,
  onSuccess,
  senderAddress,
}: {
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress: string;
  sourceTokenAddress?: string;
  sourceTokenChainId?: number;
  stakingContractAddress: string;
  token: components["schemas"]["Token"];
  destinationTokenAmount?: string;
  onSuccess?: (amount: string) => void;
  /** Optional sender (payer) address — pre-fills token balances when the user address is known ahead of time */
  senderAddress?: string;
}) {
  if (!recipientAddress) return null;

  const header = () => (
    <>
      <div className="from-b3-react-background to-as-on-surface-1 w-full rounded-t-lg bg-gradient-to-t">
        <div className="mb-1 flex w-full flex-col items-center gap-2">
          <span className="font-sf-rounded text-2xl font-semibold">Swap & Stake {token.symbol} (Exact In)</span>
        </div>
      </div>
    </>
  );

  const customExactInConfig = {
    functionAbi: STAKE_FOR_FUNCTION_ABI,
    functionName: "stakeFor",
    functionArgs: [normalizeAddress(recipientAddress), "{{amount_out}}"],
    to: stakingContractAddress,
    spenderAddress: stakingContractAddress,
    action: `stake ${token.symbol}`,
  };

  return (
    <AnySpendCustomExactIn
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={recipientAddress}
      sourceTokenAddress={sourceTokenAddress}
      sourceTokenChainId={sourceTokenChainId}
      destinationToken={token}
      destinationChainId={base.id}
      destinationTokenAmount={destinationTokenAmount}
      customExactInConfig={customExactInConfig}
      header={header}
      onSuccess={onSuccess}
      senderAddress={senderAddress}
    />
  );
}
