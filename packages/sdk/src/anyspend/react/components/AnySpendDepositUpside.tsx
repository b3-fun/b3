import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { normalizeAddress } from "@b3dotfun/sdk/anyspend/utils";
import { base } from "viem/chains";
import { AnySpendCustomExactIn } from "./AnySpendCustomExactIn";

const DEPOSIT_FOR_FUNCTION_ABI = JSON.stringify([
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "depositFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]);

export function AnySpendDepositUpside({
  loadOrder,
  mode = "modal",
  recipientAddress,
  sourceTokenAddress,
  sourceTokenChainId,
  depositContractAddress,
  token,
  onSuccess,
  clientReferenceId,
}: {
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress: string;
  sourceTokenAddress?: string;
  sourceTokenChainId?: number;
  depositContractAddress: string;
  token: components["schemas"]["Token"];
  onSuccess?: (amount: string) => void;
  clientReferenceId?: string;
}) {
  if (!recipientAddress) return null;

  const header = () => (
    <>
      <div className="from-b3-react-background to-as-on-surface-1 w-full rounded-t-lg bg-gradient-to-t">
        <div className="mb-1 flex w-full flex-col items-center gap-2">
          <span className="font-sf-rounded text-2xl font-semibold">Swap & Deposit {token.symbol}</span>
        </div>
      </div>
    </>
  );

  const customExactInConfig = {
    functionAbi: DEPOSIT_FOR_FUNCTION_ABI,
    functionName: "depositFor",
    functionArgs: [normalizeAddress(recipientAddress), "{{amount_out}}"],
    to: depositContractAddress,
    spenderAddress: depositContractAddress,
    action: `deposit ${token.symbol}`,
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
      customExactInConfig={customExactInConfig}
      header={header}
      onSuccess={onSuccess}
      clientReferenceId={clientReferenceId}
    />
  );
}
