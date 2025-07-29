import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import {
  Button,
  GlareCardRounded,
  Input,
  StyleRoot,
  TextLoop,
  useChainSwitchWithAction,
  useHasMounted,
  useModalStore,
  useTokenBalance,
} from "@b3dotfun/sdk/global-account/react";
import { baseMainnet } from "@b3dotfun/sdk/shared/constants/chains/supported";
import invariant from "invariant";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createPublicClient, encodeFunctionData, erc20Abi, formatUnits, http } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AnySpendCustom } from "./AnySpendCustom";
import { EthIcon } from "./icons/EthIcon";
import { SolIcon } from "./icons/SolIcon";
import { UsdcIcon } from "./icons/USDCIcon";

const SPIN_WHEEL_ABI = [
  {
    inputs: [],
    name: "getPaymentConfig",
    outputs: [
      { internalType: "address", name: "paymentToken", type: "address" },
      { internalType: "uint256", name: "pricePerEntry", type: "uint256" },
      { internalType: "uint256", name: "maxEntriesPerUser", type: "uint256" },
      { internalType: "address", name: "paymentRecipient", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "entryModule",
    outputs: [{ internalType: "contract IEntryModuleV2", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "quantity", type: "uint256" },
    ],
    name: "buyEntriesAndSpin",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getWheelInfo",
    outputs: [
      { internalType: "address", name: "creator_", type: "address" },
      { internalType: "uint256", name: "startTime_", type: "uint256" },
      { internalType: "uint256", name: "endTime_", type: "uint256" },
      { internalType: "uint256", name: "totalPrizesAvailable_", type: "uint256" },
      { internalType: "uint256", name: "prizesRequestedCount_", type: "uint256" },
      { internalType: "enum SpinWheelV2.WheelState", name: "state_", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface PaymentConfig {
  pricePerEntry: bigint;
  maxEntriesPerUser: bigint;
  paymentRecipient: string;
  entryModule: string;
}

interface WheelInfo {
  creator_: string;
  startTime_: bigint;
  endTime_: bigint;
  totalPrizesAvailable_: bigint;
  prizesRequestedCount_: bigint;
  state_: number;
}

type WheelStatus = "not_started" | "active" | "ended" | "sold_out";

function getWheelStatus(wheelInfo: WheelInfo): WheelStatus {
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (now < wheelInfo.startTime_) {
    return "not_started";
  }

  if (now > wheelInfo.endTime_) {
    return "ended";
  }

  if (wheelInfo.totalPrizesAvailable_ <= wheelInfo.prizesRequestedCount_) {
    return "sold_out";
  }

  return "active";
}

function generateEncodedDataForBuyEntriesAndSpin(user: string, quantity: string): string {
  invariant(BigInt(quantity) > 0, "Quantity must be greater than zero");
  const encodedData = encodeFunctionData({
    abi: SPIN_WHEEL_ABI,
    functionName: "buyEntriesAndSpin",
    args: [user as `0x${string}`, BigInt(quantity)],
  });
  return encodedData;
}

const basePublicClient = createPublicClient({
  chain: baseMainnet,
  transport: http(),
});

export function AnySpendBuySpin({
  isMainnet = true,
  loadOrder,
  mode = "modal",
  spinwheelContractAddress,
  chainId,
  recipientAddress,
  prefillQuantity,
  onSuccess,
}: {
  isMainnet?: boolean;
  loadOrder?: string;
  mode?: "modal" | "page";
  spinwheelContractAddress: string;
  chainId: number;
  recipientAddress: string;
  prefillQuantity?: string;
  onSuccess?: (txHash?: string) => void;
}) {
  const hasMounted = useHasMounted();
  const { setB3ModalOpen } = useModalStore();

  // Payment config state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string>("");
  const [wheelInfo, setWheelInfo] = useState<WheelInfo | null>(null);

  // Fetch B3 token balance
  const {
    formattedBalance: b3Balance,
    isLoading: isBalanceLoading,
    rawBalance: b3RawBalance,
  } = useTokenBalance({
    token: B3_TOKEN,
  });

  // Wagmi hooks
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAndExecute } = useChainSwitchWithAction();

  // State for direct buying flow (when user has B3 tokens)
  const [isBuying, setIsBuying] = useState(false);
  const [buyingTxHash, setBuyingTxHash] = useState<string>("");
  const {
    isLoading: isTxPending,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: buyingTxHash as `0x${string}`,
    query: {
      structuralSharing: false,
    },
  });

  // Handle transaction status
  useEffect(() => {
    if (!buyingTxHash) return;

    if (isTxSuccess) {
      setB3ModalOpen(false);
      onSuccess?.(buyingTxHash);
      toast.success("Spin purchase transaction confirmed!");
      setIsBuying(false);
    } else if (isTxError) {
      console.error("@@anyspend-buy-spin:tx-error:", txError);
      toast.error("Transaction failed. Please try again.");
      setB3ModalOpen(false);
      setIsBuying(false);
    }
  }, [isTxSuccess, isTxError, buyingTxHash, onSuccess, setB3ModalOpen, txError]);

  // Spin quantity state
  const [userSpinQuantity, setUserSpinQuantity] = useState<string>("");
  const [showAmountPrompt, setShowAmountPrompt] = useState<boolean>(true);
  const [isQuantityValid, setIsQuantityValid] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [displayQuantity, setDisplayQuantity] = useState<string>("");
  const [debouncedQuantity, setDebouncedQuantity] = useState<string>("");

  useEffect(() => {
    if (prefillQuantity && wheelInfo) {
      const remainingSpins = wheelInfo.totalPrizesAvailable_ - wheelInfo.prizesRequestedCount_;
      const adjustedQuantity = BigInt(prefillQuantity) > remainingSpins ? remainingSpins.toString() : prefillQuantity;
      validateAndSetQuantity(adjustedQuantity);
    }
  }, [prefillQuantity, wheelInfo]);

  // Calculate total cost
  const totalCost =
    paymentConfig && userSpinQuantity ? paymentConfig.pricePerEntry * BigInt(userSpinQuantity) : BigInt(0);

  // Fetch payment configuration and wheel info
  const fetchPaymentConfig = useCallback(async () => {
    if (!basePublicClient || !spinwheelContractAddress) return;

    try {
      setIsLoadingConfig(true);
      setConfigError("");

      const [config, entryModuleAddress, wheelInfo] = await Promise.all([
        basePublicClient.readContract({
          address: spinwheelContractAddress as `0x${string}`,
          abi: SPIN_WHEEL_ABI,
          functionName: "getPaymentConfig",
        }),
        basePublicClient.readContract({
          address: spinwheelContractAddress as `0x${string}`,
          abi: SPIN_WHEEL_ABI,
          functionName: "entryModule",
        }),
        basePublicClient.readContract({
          address: spinwheelContractAddress as `0x${string}`,
          abi: SPIN_WHEEL_ABI,
          functionName: "getWheelInfo",
        }),
      ]);

      const paymentConfig: PaymentConfig = {
        pricePerEntry: config[1],
        maxEntriesPerUser: config[2],
        paymentRecipient: config[3],
        entryModule: entryModuleAddress,
      };

      const wheelInfoData: WheelInfo = {
        creator_: wheelInfo[0],
        startTime_: wheelInfo[1],
        endTime_: wheelInfo[2],
        totalPrizesAvailable_: wheelInfo[3],
        prizesRequestedCount_: wheelInfo[4],
        state_: wheelInfo[5],
      };

      setPaymentConfig(paymentConfig);
      setWheelInfo(wheelInfoData);
    } catch (error) {
      console.error("@@anyspend-buy-spin:config-error:", error);
      setConfigError("Failed to load spin wheel configuration");
      toast.error("Failed to load spin wheel configuration");
    } finally {
      setIsLoadingConfig(false);
    }
  }, [spinwheelContractAddress]);

  // Fetch config on mount and when dependencies change
  useEffect(() => {
    fetchPaymentConfig();
  }, [fetchPaymentConfig]);

  // Debounce the quantity for balance checks
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuantity(displayQuantity);
    }, 500);

    return () => clearTimeout(timer);
  }, [displayQuantity, userSpinQuantity]);

  const validateAndSetQuantity = (value: string) => {
    // Only allow positive integers
    const isValidFormat = /^\d+$/.test(value) || value === "";

    if (!isValidFormat && value !== "") {
      return;
    }

    setDisplayQuantity(value);

    try {
      if (value === "") {
        setUserSpinQuantity("");
        setIsQuantityValid(false);
        setValidationError("");
        return;
      }

      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue <= 0) {
        setIsQuantityValid(false);
        setUserSpinQuantity("");
        setValidationError("Please enter a valid positive number");
        return;
      }

      // Check maximum entries per user (0 means no limit)
      if (
        paymentConfig &&
        paymentConfig.maxEntriesPerUser > BigInt(0) &&
        BigInt(numValue) > paymentConfig.maxEntriesPerUser
      ) {
        setIsQuantityValid(false);
        setUserSpinQuantity("");
        setValidationError(`Maximum ${paymentConfig.maxEntriesPerUser.toString()} spins allowed`);
        return;
      }

      // Check if quantity exceeds remaining entries
      if (wheelInfo && BigInt(numValue) > wheelInfo.totalPrizesAvailable_ - wheelInfo.prizesRequestedCount_) {
        setIsQuantityValid(false);
        setUserSpinQuantity("");
        setValidationError(
          `Only ${(wheelInfo.totalPrizesAvailable_ - wheelInfo.prizesRequestedCount_).toString()} spins remaining`,
        );
        return;
      }

      setUserSpinQuantity(value);
      setIsQuantityValid(true);
      setValidationError("");
    } catch (error) {
      setIsQuantityValid(false);
      setUserSpinQuantity("");
      setValidationError("Please enter a valid quantity");
    }
  };

  const handleDirectBuying = async () => {
    if (!address || !basePublicClient || !userSpinQuantity || !paymentConfig) return;

    try {
      setIsBuying(true);

      await switchChainAndExecute(chainId, async () => {
        // Check current allowance for B3 token to entryModule
        const allowance = await basePublicClient.readContract({
          address: B3_TOKEN.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, paymentConfig.entryModule as `0x${string}`],
        });

        // If allowance is insufficient, request approval
        if (allowance < totalCost) {
          toast.info("Approving B3 spending...");

          await writeContractAsync({
            address: B3_TOKEN.address as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [paymentConfig.entryModule as `0x${string}`, totalCost],
          });

          toast.info("Approval confirmed. Proceeding with spin purchase...");
        }

        // Execute the buy entries and spin
        toast.info("Buying spins...");
        const buyHash = await writeContractAsync({
          address: spinwheelContractAddress as `0x${string}`,
          abi: SPIN_WHEEL_ABI,
          functionName: "buyEntriesAndSpin",
          args: [address, BigInt(userSpinQuantity)],
        });

        setBuyingTxHash(buyHash);
        toast.success("Spin purchase transaction submitted!");
      });
    } catch (error) {
      console.error("@@anyspend-buy-spin:error:", error);
      toast.error("Spin purchase failed. Please try again.");
      setB3ModalOpen(false);
    } finally {
      setIsBuying(false);
    }
  };

  const confirmQuantity = () => {
    if (!isQuantityValid || !paymentConfig) {
      toast.error("Please enter a valid quantity to buy");
      return;
    }

    // Check if user has sufficient B3 balance for direct buying
    const hasEnoughBalance = b3RawBalance && totalCost <= b3RawBalance;

    if (hasEnoughBalance) {
      // User has enough B3, proceed with direct buying
      handleDirectBuying();
    } else {
      // User needs more B3, proceed to AnySpend conversion flow
      setShowAmountPrompt(false);
    }
  };

  const header = () => (
    <>
      <div className="relative mx-auto size-32">
        <div className="absolute inset-0 scale-95 rounded-[50%] bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl"></div>
        <GlareCardRounded className="overflow-hidden rounded-full border-none bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm">
          <img alt="B3 Token" className="size-full" src="https://cdn.b3.fun/b3-coin-3d.png" />
          <div className="absolute inset-0 rounded-[50%] border border-white/20"></div>
        </GlareCardRounded>
      </div>
      <div className="from-b3-react-background to-as-on-surface-1 mt-[-60px] w-full rounded-t-lg bg-gradient-to-t">
        <div className="h-[60px] w-full" />
        <div className="mb-1 flex w-full flex-col items-center gap-2 p-5">
          <span className="font-sf-rounded text-2xl font-semibold">
            Buy {userSpinQuantity || ""} Spin{userSpinQuantity !== "1" ? "s" : ""}
          </span>
          <p className="text-as-primary/70 text-sm">Pay with B3 • Get spin wheel entries</p>
        </div>
      </div>
    </>
  );

  const onFocusQuantityInput = () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  };

  // Loading state
  if (isLoadingConfig) {
    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center justify-center p-8">
          <Loader2 className="text-as-primary/70 h-8 w-8 animate-spin" />
          <p className="text-as-primary/70 mt-2 text-sm">Loading spin wheel configuration...</p>
        </div>
      </StyleRoot>
    );
  }

  // Error state
  if (configError || !paymentConfig) {
    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center justify-center p-8">
          <p className="text-as-red mb-4 text-center">{configError || "Failed to load configuration"}</p>
          <Button onClick={fetchPaymentConfig} variant="outline">
            Retry
          </Button>
        </div>
      </StyleRoot>
    );
  }

  // Render quantity input prompt
  if (showAmountPrompt) {
    const pricePerEntry = formatUnits(paymentConfig.pricePerEntry, 18);
    const remainingEntries = wheelInfo ? wheelInfo.totalPrizesAvailable_ - wheelInfo.prizesRequestedCount_ : BigInt(0);
    const wheelStatus = wheelInfo ? getWheelStatus(wheelInfo) : null;
    const isActive = wheelStatus === "active";

    const getStatusMessage = () => {
      if (!wheelInfo) return null;

      const formatDate = (timestamp: bigint) => {
        return new Date(Number(timestamp) * 1000).toLocaleString();
      };

      switch (wheelStatus) {
        case "not_started":
          return {
            title: "Spin Wheel Not Started",
            message: `Starts at ${formatDate(wheelInfo.startTime_)}`,
          };
        case "ended":
          return {
            title: "Spin Wheel Ended",
            message: `Ended at ${formatDate(wheelInfo.endTime_)}`,
          };
        case "sold_out":
          return {
            title: "All Spins Have Been Claimed",
            message: "Stay tuned for the next spin wheel event!",
          };
        default:
          return null;
      }
    };

    const statusInfo = getStatusMessage();

    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center">
          <div className="w-full px-4 pb-2 pt-4">
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)",
              }}
              transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
              className={`flex justify-center ${isActive ? "mb-4" : ""}`}
            >
              <img
                alt="B3 Token"
                loading="lazy"
                width="64"
                height="64"
                decoding="async"
                className="rounded-full"
                src="https://cdn.b3.fun/b3-coin-3d.png"
              />
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)",
              }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
              className="text-center"
            >
              {isActive ? (
                <>
                  <h2 className="font-sf-rounded text-as-primary mb-4 text-2xl font-bold">
                    {(() => {
                      const hasEnoughBalance = b3RawBalance && totalCost <= b3RawBalance;
                      return hasEnoughBalance || !debouncedQuantity ? "Buy Spins" : `Swap & Buy Spins`;
                    })()}
                  </h2>
                  {wheelInfo && (
                    <div className="inline-flex items-center gap-2">
                      <div className="bg-as-brand/10 border-as-brand/10 inline-flex items-center rounded-full border px-3 py-1">
                        <p className="text-as-brand text-sm font-medium">{pricePerEntry} $B3 per spin</p>
                      </div>
                      <div className="bg-as-brand/10 border-as-brand/10 inline-flex items-center rounded-full border px-3 py-1">
                        <p className="text-as-brand text-sm font-medium">{remainingEntries.toString()} remaining</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                statusInfo && (
                  <div className="text-center">
                    <p className="text-as-primary text-lg font-semibold">{statusInfo.title}</p>
                    <p className="text-as-primary/70 mt-2 text-sm">{statusInfo.message}</p>
                  </div>
                )
              )}
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
            {isActive ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-as-primary/70 text-sm font-medium">Number of spins</p>
                  <span className="text-as-primary/50 flex items-center gap-1 text-sm">
                    Available: {isBalanceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${b3Balance} B3`}
                  </span>
                </div>

                <div className="relative">
                  <Input
                    onFocus={onFocusQuantityInput}
                    type="text"
                    placeholder="1"
                    value={displayQuantity}
                    onChange={e => validateAndSetQuantity(e.target.value)}
                    className={`h-14 px-4 pr-20 text-lg ${!isQuantityValid && displayQuantity ? "border-as-red" : "border-b3-react-border"}`}
                  />
                  <div className="font-pack absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-blue-500/70">
                    {displayQuantity === "1" ? "Spin" : "Spins"}
                  </div>
                </div>

                {!isQuantityValid && displayQuantity && <p className="text-as-red text-sm">{validationError}</p>}

                <div className="bg-as-on-surface-2/30 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-as-primary/70 text-sm font-medium">Total Cost:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-as-primary text-lg font-bold">
                        {displayQuantity && isQuantityValid ? formatUnits(totalCost, 18) : "0"} B3
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {(() => {
                    const hasEnoughBalance = b3RawBalance && totalCost <= b3RawBalance;

                    if (!hasEnoughBalance && debouncedQuantity) {
                      return (
                        <div className="bg-as-brand/10 flex flex-col items-center gap-2 rounded-lg p-4 pb-5">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-as-primary text-sm font-semibold">Swap & buy from any token</span>
                            <TextLoop>
                              <EthIcon className="h-8 w-8" />
                              <SolIcon className="h-8 w-8" />
                              <UsdcIcon className="h-8 w-8" />
                            </TextLoop>
                            <ArrowRight className="text-as-primary h-4 w-4" />
                            <img src="https://cdn.b3.fun/b3-coin-3d.png" className="h-7 w-7" alt="B3 Token" />
                          </div>
                          <p className="text-as-primary/50 text-sm font-medium">
                            No problem, we'll help you swap to B3 for your spins!
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>

                <Button
                  onClick={confirmQuantity}
                  disabled={!isQuantityValid || !displayQuantity || isBuying || isTxPending}
                  className="bg-as-brand hover:bg-as-brand/90 text-as-primary mt-4 h-14 w-full rounded-xl text-lg font-medium"
                >
                  {isBuying ? "Buying..." : isTxPending ? "Confirming..." : "Continue"}
                </Button>
              </div>
            ) : null}
          </motion.div>
        </div>
      </StyleRoot>
    );
  }

  // AnySpend flow for when user needs to swap to B3
  const encodedData = generateEncodedDataForBuyEntriesAndSpin(address || "", userSpinQuantity);

  return (
    <AnySpendCustom
      isMainnet={isMainnet}
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={recipientAddress}
      orderType={"custom"}
      dstChainId={chainId}
      dstToken={B3_TOKEN}
      dstAmount={totalCost.toString()}
      contractAddress={spinwheelContractAddress}
      spenderAddress={paymentConfig.entryModule}
      encodedData={encodedData}
      metadata={{
        type: "custom",
        action: `buy ${userSpinQuantity} spin${userSpinQuantity !== "1" ? "s" : ""}`,
      }}
      header={header}
      onSuccess={txHash => onSuccess?.(txHash)}
      showRecipient={false}
    />
  );
}
