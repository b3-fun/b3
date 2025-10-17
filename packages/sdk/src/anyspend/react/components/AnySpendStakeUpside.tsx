import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { StyleRoot } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import invariant from "invariant";
import { encodeFunctionData } from "viem";
import { base } from "viem/chains";
import { B3_STAKING_CONTRACT, WETH_STAKING_CONTRACT } from "../../abis/upsideStaking";
import { AnySpendCustom } from "./AnySpendCustom";

function generateEncodedDataForStaking(amount: string, beneficiary: string, poolType: "b3" | "weth"): string {
  invariant(BigInt(amount) > 0, "Amount must be greater than zero");
  if (poolType === "weth") {
    return encodeFunctionData({
      abi: WETH_STAKING_CONTRACT,
      functionName: "stakeFor",
      args: [beneficiary as `0x${string}`, BigInt(amount)],
    });
  } else if (poolType === "b3") {
    return encodeFunctionData({
      abi: B3_STAKING_CONTRACT,
      functionName: "stakeFor",
      args: [beneficiary as `0x${string}`, BigInt(amount)],
    });
  }
  throw new Error("Unsupported pool type");
}

export function AnySpendStakeUpside({
  loadOrder,
  mode = "modal",
  beneficiaryAddress,
  stakeAmount,
  stakingContractAddress,
  token,
  poolType,
  onSuccess,
}: {
  loadOrder?: string;
  mode?: "modal" | "page";
  beneficiaryAddress: string;
  stakeAmount: string;
  stakingContractAddress: string;
  token: components["schemas"]["Token"];
  poolType: "b3" | "weth";
  onSuccess?: () => void;
}) {
  const header = () => (
    <>
      <div className="relative mx-auto size-32">
        <img alt="token" className="size-full" src={token.metadata.logoURI || "https://cdn.b3.fun/b3-coin-3d.png"} />
      </div>
      <div className="from-b3-react-background to-as-on-surface-1 mt-[-60px] w-full rounded-t-lg bg-gradient-to-t">
        <div className="h-[60px] w-full" />
        <div className="mb-1 flex w-full flex-col items-center gap-2 p-5">
          <span className="font-sf-rounded text-2xl font-semibold">
            Swap & Stake {stakeAmount ? formatTokenAmount(BigInt(stakeAmount), token.decimals) : ""} {token.symbol}
          </span>
        </div>
      </div>
    </>
  );

  // Only generate encoded data if we have a valid beneficiary address
  // This is used for the AnySpendCustom swap & stake flow
  if (!beneficiaryAddress || beneficiaryAddress === "") {
    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center justify-center p-8">
          <p className="font-medium text-yellow-600 dark:text-yellow-400">⚠️ Please connect your wallet to continue.</p>
        </div>
      </StyleRoot>
    );
  }

  const encodedData = generateEncodedDataForStaking(stakeAmount, beneficiaryAddress, poolType);

  return (
    <AnySpendCustom
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={beneficiaryAddress}
      orderType={"custom"}
      dstChainId={base.id}
      dstToken={token}
      dstAmount={stakeAmount}
      contractAddress={stakingContractAddress}
      encodedData={encodedData}
      metadata={{
        action: `stake ${token.symbol}`,
      }}
      header={header}
      onSuccess={onSuccess}
      showRecipient={true}
    />
  );
}
