import { components } from "@b3dotfun/sdk/anyspend/types/api";
import {
  Button,
  GlareCardRounded,
  StyleRoot,
  useHasMounted,
  useModalStore,
  useUnifiedChainSwitchAndExecute,
} from "@b3dotfun/sdk/global-account/react";
import { PUBLIC_BASE_RPC_URL } from "@b3dotfun/sdk/shared/constants";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import invariant from "invariant";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { base } from "viem/chains";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { B3_STAKING_CONTRACT, WETH_STAKING_CONTRACT } from "../../abis/upsideStaking";
import { AnySpendCustom } from "./AnySpendCustom";

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

const basePublicClient = createPublicClient({
  chain: base,
  transport: http(PUBLIC_BASE_RPC_URL),
});

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
  const hasMounted = useHasMounted();
  const { setB3ModalOpen } = useModalStore();

  // Wagmi hooks for direct staking
  const { address } = useAccount();
  const { switchChainAndExecute } = useUnifiedChainSwitchAndExecute();

  // State for direct staking flow
  const [stakingTxHash, setStakingTxHash] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Wait for transaction confirmation
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: stakingTxHash as `0x${string}`,
    query: {
      structuralSharing: false, // Disable to avoid BigInt serialization issues
    },
  });

  // Show success modal when transaction is confirmed
  useEffect(() => {
    if (isTxSuccess && stakingTxHash) {
      setShowSuccessModal(true);
    }
  }, [isTxSuccess, stakingTxHash]);

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

  // Note: Direct staking is available via handleDirectStaking()
  // but we're forcing all flows through AnySpendCustom

  // Success Modal for Direct Staking
  if (showSuccessModal) {
    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center">
          <div className="w-full p-4">
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)",
              }}
              transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
              className="relative mx-auto mb-4 size-[120px]"
            >
              <div className="absolute inset-0 scale-95 rounded-[50%] bg-black/30 blur-md"></div>
              <GlareCardRounded className="overflow-hidden rounded-full border-none">
                <img
                  alt="b3 coin"
                  loading="lazy"
                  width="64"
                  height="64"
                  decoding="async"
                  data-nimg="1"
                  className="size-full shrink-0 bg-transparent text-transparent"
                  src="https://cdn.b3.fun/b3-coin-3d.png"
                />
                <div className="absolute inset-0 rounded-[50%] border border-white/10"></div>
              </GlareCardRounded>
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)",
              }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
            >
              <h2 className="font-sf-rounded mb-1 text-center text-2xl font-semibold">
                Staked {formatTokenAmount(BigInt(stakeAmount), token.decimals)} {token.symbol}
              </h2>
            </motion.div>
          </div>

          <motion.div
            initial={false}
            animate={{
              opacity: hasMounted ? 1 : 0,
              y: hasMounted ? 0 : 20,
              filter: hasMounted ? "blur(0px)" : "blur(10px)",
            }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
            className="bg-b3-react-background w-full p-6"
          >
            <div className="mb-6">
              <a
                href={`https://basescan.org/tx/${stakingTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-as-primary/70 hover:text-as-primary block break-all text-center font-mono text-sm underline transition-colors"
              >
                View transaction
              </a>
            </div>

            <Button
              onClick={() => {
                setB3ModalOpen(false);
                onSuccess?.();
              }}
              className="bg-as-brand hover:bg-as-brand/90 text-as-primary h-14 w-full rounded-xl text-lg font-medium"
            >
              Done
            </Button>
          </motion.div>
        </div>
      </StyleRoot>
    );
  }

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
