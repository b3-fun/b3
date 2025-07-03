import { ABI_ERC20_STAKING, B3_TOKEN, OrderType } from "@b3dotfun/sdk/anyspend";
import { EthIcon } from "./icons/EthIcon";
import { SolIcon } from "./icons/SolIcon";
import { UsdcIcon } from "./icons/USDCIcon";
import {
  Button,
  GlareCardRounded,
  Input,
  TextLoop,
  useHasMounted,
  useModalStore,
  useChainSwitchWithAction,
  useTokenBalance,
  StyleRoot
} from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { motion } from "framer-motion";
import invariant from "invariant";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createPublicClient, encodeFunctionData, erc20Abi, http } from "viem";
import { base } from "viem/chains";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AnySpendCustom } from "./AnySpendCustom";

const basePublicClient = createPublicClient({
  chain: base,
  transport: http()
});

const ERC20Staking = "0xbf04200be3cbf371467a539706393c81c470f523";

function generateEncodedDataForStakingB3(amount: string, beneficiary: string): string {
  invariant(BigInt(amount) > 0, "Amount must be greater than zero");
  const encodedData = encodeFunctionData({
    abi: ABI_ERC20_STAKING,
    functionName: "stake",
    args: [BigInt(amount), beneficiary]
  });
  return encodedData;
}

export function AnySpendStakeB3({
  isMainnet = true,
  loadOrder,
  mode = "modal",
  recipientAddress,
  stakeAmount,
  onSuccess
}: {
  isMainnet?: boolean;
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress: string;
  stakeAmount?: string;
  onSuccess?: () => void;
}) {
  const hasMounted = useHasMounted();
  const { setB3ModalOpen } = useModalStore();

  // Fetch B3 token balance
  const {
    formattedBalance: b3Balance,
    isLoading: isBalanceLoading,
    rawBalance: b3RawBalance
  } = useTokenBalance({
    token: B3_TOKEN
  });

  // Wagmi hooks for direct staking
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAndExecute } = useChainSwitchWithAction();

  // State for direct staking flow
  const [isStaking, setIsStaking] = useState(false);
  const [stakingTxHash, setStakingTxHash] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Wait for transaction confirmation
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: stakingTxHash as `0x${string}`,
    query: {
      structuralSharing: false // Disable to avoid BigInt serialization issues
    }
  });

  // Show success modal when transaction is confirmed
  useEffect(() => {
    if (isTxSuccess && stakingTxHash) {
      setShowAmountPrompt(false);
      setShowSuccessModal(true);
      setIsStaking(false);
    }
  }, [isTxSuccess, stakingTxHash]);

  const [userStakeAmount, setUserStakeAmount] = useState<string>(stakeAmount || "");
  const [showAmountPrompt, setShowAmountPrompt] = useState<boolean>(!stakeAmount);
  const [isAmountValid, setIsAmountValid] = useState<boolean>(!!stakeAmount);
  const [validationError, setValidationError] = useState<string>("");
  // Store display amount for UI
  const [displayAmount, setDisplayAmount] = useState<string>("");
  // Debounced state for balance checks and messaging
  const [debouncedAmount, setDebouncedAmount] = useState<string>("");
  const [debouncedUserStakeAmount, setDebouncedUserStakeAmount] = useState<string>("");

  // Debounce the amount for balance checks
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(displayAmount);
      setDebouncedUserStakeAmount(userStakeAmount);
    }, 500);

    return () => clearTimeout(timer);
  }, [displayAmount, userStakeAmount]);

  useEffect(() => {
    if (stakeAmount) {
      setUserStakeAmount(stakeAmount);
      setShowAmountPrompt(false);
      setIsAmountValid(true);
    }
  }, [stakeAmount]);

  const validateAndSetAmount = (value: string) => {
    // Allow decimal input by validating against a pattern
    // This regex allows numbers with up to 18 decimal places
    const isValidFormat = /^(\d+\.?\d{0,18}|\.\d{1,18})$/.test(value) || value === "";

    if (!isValidFormat && value !== "") {
      return;
    }

    setDisplayAmount(value);

    try {
      if (value === "" || value === ".") {
        setUserStakeAmount("");
        setIsAmountValid(false);
        setValidationError("");
        return;
      }

      // For UI validation - check if it's a positive number
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setIsAmountValid(false);
        setUserStakeAmount("");
        setValidationError("Please enter a valid positive number");
        return;
      }

      // Check minimum stake amount (50 B3)
      if (numValue < 50) {
        setIsAmountValid(false);
        setUserStakeAmount("");
        setValidationError("Minimum stake amount is 50 B3");
        return;
      }

      // Convert to wei (multiply by 10^18)
      // Handle decimal places correctly by removing the decimal point
      let fullAmount;
      if (value.includes(".")) {
        const [whole, fraction = ""] = value.split(".");
        // Pad with zeros to 18 decimal places
        const paddedFraction = fraction.padEnd(18, "0");
        fullAmount = whole + paddedFraction;
      } else {
        fullAmount = value + "000000000000000000"; // Add 18 zeros
      }

      // Remove leading zeros
      fullAmount = fullAmount.replace(/^0+/, "") || "0";

      // Set the full amount for the actual transaction
      setUserStakeAmount(fullAmount);
      setIsAmountValid(true);
      setValidationError("");
    } catch (error) {
      setIsAmountValid(false);
      setUserStakeAmount("");
      setValidationError("Please enter a valid amount");
    }
  };

  const handleDirectStaking = async () => {
    if (!address || !basePublicClient || !userStakeAmount) return;

    try {
      setIsStaking(true);

      await switchChainAndExecute(base.id, async () => {
        // Check current allowance
        const allowance = await basePublicClient.readContract({
          address: B3_TOKEN.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, ERC20Staking as `0x${string}`]
        });

        // If allowance is insufficient, request approval
        if (allowance < BigInt(userStakeAmount)) {
          toast.info("Approving B3 spending...");

          await writeContractAsync({
            address: B3_TOKEN.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [ERC20Staking as `0x${string}`, BigInt(userStakeAmount)]
          });

          toast.info("Approval confirmed. Proceeding with stake...");
        }

        // Execute the stake
        toast.info("Staking B3...");
        const stakeHash = await writeContractAsync({
          address: ERC20Staking as `0x${string}`,
          abi: ABI_ERC20_STAKING,
          functionName: "stake",
          args: [BigInt(userStakeAmount), recipientAddress as `0x${string}`]
        });

        setStakingTxHash(stakeHash);
        toast.success("Staking transaction submitted!");
      });
    } catch (error) {
      console.error("@@b3-stake:error:", error);
      toast.error("Staking failed. Please try again.");
      setShowSuccessModal(false); // Ensure modal doesn't show on error
    } finally {
      setIsStaking(false);
    }
  };

  const confirmAmount = () => {
    if (!isAmountValid) {
      toast.error("Please enter a valid amount to stake");
      return;
    }

    // Check if user has sufficient B3 balance for direct staking
    const hasEnoughBalance = b3RawBalance && BigInt(userStakeAmount) <= b3RawBalance;

    if (hasEnoughBalance) {
      // User has enough B3, proceed with direct staking
      handleDirectStaking();
    } else {
      // User needs more B3, proceed to AnySpend conversion flow
      setShowAmountPrompt(false);
    }
  };

  const header = () => (
    <>
      <div className="relative mx-auto size-32">
        <img alt="b3 coin" className="size-full" src="https://cdn.b3.fun/b3-coin-3d.png" />
      </div>
      <div className="from-b3-react-background to-as-on-surface-1 mt-[-60px] w-full rounded-t-lg bg-gradient-to-t">
        <div className="h-[60px] w-full" />
        <div className="mb-1 flex w-full flex-col items-center gap-2 p-5">
          <span className="font-sf-rounded text-2xl font-semibold">
            Swap & Staked {userStakeAmount ? formatTokenAmount(BigInt(userStakeAmount), 18) : ""} B3
          </span>
        </div>
      </div>
    </>
  );

  const onFocusStakeAmountInput = () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  };

  // Render amount input prompt if no stake amount is provided
  if (showAmountPrompt) {
    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center">
          <div className="w-full px-4">
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)"
              }}
              transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
              className="relative mx-auto size-48"
            >
              <video autoPlay muted playsInline className="size-full" src="https://cdn.b3.fun/b3-sphere-to-coin.mp4" />
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)"
              }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
            >
              <h2 className="font-sf-rounded font-neue-montreal-medium mb-1 text-center text-2xl font-semibold">
                {(() => {
                  const hasEnoughBalance = b3RawBalance && BigInt(debouncedUserStakeAmount || "0") <= b3RawBalance;
                  return hasEnoughBalance || !debouncedAmount ? "Stake B3" : "Swap & Stake B3";
                })()}
              </h2>
            </motion.div>
          </div>

          <motion.div
            initial={false}
            animate={{
              opacity: hasMounted ? 1 : 0,
              y: hasMounted ? 0 : 20,
              filter: hasMounted ? "blur(0px)" : "blur(10px)"
            }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
            className="bg-b3-react-background w-full p-6"
          >
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <p className="text-as-primary/70 text-sm font-medium">I want to stake</p>
                <span className="text-as-primary/50 flex items-center gap-1 text-sm">
                  Available: {isBalanceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${b3Balance} B3`}
                </span>
              </div>
            </div>

            <div className="relative">
              <Input
                onFocus={onFocusStakeAmountInput}
                type="text"
                placeholder="0.00"
                value={displayAmount}
                onChange={e => validateAndSetAmount(e.target.value)}
                className={`h-14 px-4 text-lg ${!isAmountValid && displayAmount ? "border-as-red" : "border-b3-react-border"}`}
              />
              <div className="font-pack absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-blue-500/70">
                B3
              </div>
            </div>

            {!isAmountValid && displayAmount && <p className="text-as-red mt-2 text-sm">{validationError}</p>}

            <div className="mt-4">
              {(() => {
                const hasEnoughBalance = b3RawBalance && BigInt(debouncedUserStakeAmount || "0") <= b3RawBalance;

                if (!hasEnoughBalance || !debouncedAmount) {
                  return (
                    <div className="bg-as-brand/10 flex flex-col items-center gap-2 rounded-lg p-4 pb-5">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-as-primary text-sm font-semibold">Swap & stake from any token</span>
                        <TextLoop>
                          <EthIcon className="h-8 w-8" />
                          <SolIcon className="h-8 w-8" />
                          <UsdcIcon className="h-8 w-8" />
                        </TextLoop>
                        <ArrowRight className="text-as-primary h-4 w-4" />
                        <img src="https://cdn.b3.fun/b3-coin-3d.png" className="h-7 w-7" alt="B3 Token" />
                      </div>
                      <p className="text-as-primary/50 text-sm font-medium">
                        {debouncedAmount
                          ? `No problem, we'll help you swap to ${debouncedAmount} B3!`
                          : "Not enough B3? We'll help you swap from other coins."}
                      </p>
                    </div>
                  );
                }
              })()}
            </div>

            <Button
              onClick={confirmAmount}
              disabled={!isAmountValid || !displayAmount || isStaking || isTxPending}
              className="bg-as-brand hover:bg-as-brand/90 text-as-primary mt-4 h-14 w-full rounded-xl text-lg font-medium"
            >
              {isStaking ? "Staking..." : isTxPending ? "Confirming..." : "Continue"}
            </Button>
          </motion.div>
        </div>
      </StyleRoot>
    );
  }

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
                filter: hasMounted ? "blur(0px)" : "blur(10px)"
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
                filter: hasMounted ? "blur(0px)" : "blur(10px)"
              }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
            >
              <h2 className="font-sf-rounded mb-1 text-center text-2xl font-semibold">
                Staked {formatTokenAmount(BigInt(userStakeAmount), 18)} B3
              </h2>
            </motion.div>
          </div>

          <motion.div
            initial={false}
            animate={{
              opacity: hasMounted ? 1 : 0,
              y: hasMounted ? 0 : 20,
              filter: hasMounted ? "blur(0px)" : "blur(10px)"
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

  const encodedData = generateEncodedDataForStakingB3(userStakeAmount, recipientAddress);

  return (
    <AnySpendCustom
      isMainnet={isMainnet}
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={recipientAddress}
      orderType={OrderType.Custom}
      dstChainId={base.id}
      dstToken={B3_TOKEN}
      dstAmount={userStakeAmount}
      contractAddress={ERC20Staking}
      encodedData={encodedData}
      metadata={{
        action: "stake B3"
      }}
      header={header}
      onSuccess={onSuccess}
      showRecipient={true}
    />
  );
}
