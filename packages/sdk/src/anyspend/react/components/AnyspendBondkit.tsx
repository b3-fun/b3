import { BondkitToken } from "@b3dotfun/bondkit";
import { OrderType } from "@b3dotfun/sdk/anyspend";
import {
  Button,
  GlareCardRounded,
  Input,
  StyleRoot,
  useHasMounted,
  useTokenData,
} from "@b3dotfun/sdk/global-account/react";
import { AnySpendBondKitProps } from "@b3dotfun/sdk/global-account/react/stores/useModalStore";
import { baseMainnet } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPublicClient, encodeFunctionData, formatEther, http, parseEther } from "viem";
import { ABI_bondKit } from "../../abis/bondKit";
import { AnySpendCustom } from "./AnySpendCustom";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format number with commas
function formatNumberWithCommas(x: string): string {
  const parts = x.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function AnySpendBondKit({
  mode = "modal",
  recipientAddress,
  contractAddress,
  minTokensOut = "0",
  imageUrl,
  onSuccess,
}: AnySpendBondKitProps) {
  const hasMounted = useHasMounted();
  const [showAmountPrompt, setShowAmountPrompt] = useState(true);
  const [ethAmount, setEthAmount] = useState("");
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [quote, setQuote] = useState<string | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Create BondKit client
  const bondkitTokenClient = useMemo(() => {
    if (!contractAddress) return null;
    try {
      const client = new BondkitToken(contractAddress as `0x${string}`);
      client.connect();
      return client;
    } catch (error) {
      console.error("Error creating bondkit client", error);
      return null;
    }
  }, [contractAddress]);

  // Create a public client for reading contract data
  const basePublicClient = createPublicClient({
    chain: baseMainnet,
    transport: http(),
  });

  // Fetch token name from contract
  useEffect(() => {
    async function fetchTokenName() {
      try {
        const [name, symbol] = await Promise.all([
          basePublicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: ABI_bondKit,
            functionName: "name",
          }),
          basePublicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: ABI_bondKit,
            functionName: "symbol",
          }),
        ]);
        setTokenName(name);
        setTokenSymbol(symbol);
      } catch (error) {
        console.error("Error fetching token name:", error);
        setTokenName("BondKit Token");
        setTokenSymbol("BOND");
      }
    }

    if (contractAddress) {
      fetchTokenName();
    }
  }, [contractAddress, basePublicClient]);

  // Get native token data for the chain
  const {
    data: tokenData,
    isError: isTokenError,
    isLoading,
  } = useTokenData(baseMainnet.id, "0x0000000000000000000000000000000000000000");

  // Convert token data to AnySpend Token type
  const dstToken = useMemo(() => {
    if (!tokenData) return null;

    return {
      address: tokenData.address,
      chainId: baseMainnet.id,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      metadata: {
        logoURI: tokenData.logoURI,
      },
    };
  }, [tokenData]);

  // Debounced quote fetching
  const debouncedGetQuote = useMemo(
    () =>
      debounce(async (val: string) => {
        if (!val || Number(val) <= 0 || !bondkitTokenClient) {
          setQuote(null);
          return;
        }
        try {
          setIsLoadingQuote(true);
          const parsedAmount = parseEther(val);
          const buyQuote = await bondkitTokenClient.getAmountOfTokensToBuy(parsedAmount);
          setQuote(buyQuote ? formatEther(buyQuote) : null);
        } catch (error) {
          console.error("Error getting buy quote:", error);
          setQuote(null);
        } finally {
          setIsLoadingQuote(false);
        }
      }, 500),
    [bondkitTokenClient],
  );

  const validateAndSetAmount = (value: string) => {
    // Allow empty input
    if (value === "") {
      setEthAmount("");
      setIsAmountValid(false);
      setValidationError("");
      setQuote(null);
      return;
    }

    // Only allow numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    // Prevent multiple decimal points
    if ((value.match(/\./g) || []).length > 1) {
      return;
    }

    // Prevent more than 18 decimal places (ETH precision)
    const parts = value.split(".");
    if (parts[1] && parts[1].length > 18) {
      return;
    }

    setEthAmount(value);

    try {
      const parsedAmount = parseEther(value);
      if (parsedAmount <= 0n) {
        setIsAmountValid(false);
        setValidationError("Amount must be greater than 0");
        return;
      }

      setIsAmountValid(true);
      setValidationError("");
      debouncedGetQuote(value);
    } catch (error) {
      console.error("Error validating amount:", error);
      setIsAmountValid(false);
      setValidationError("Please enter a valid amount");
    }
  };

  const header = () => (
    <div className="w-full px-6 py-4">
      <div className="flex w-full flex-col items-center space-y-6">
        <h2 className="text-[28px] font-bold">
          {tokenName} ({tokenSymbol})
        </h2>
        <div className="flex w-full flex-col items-center space-y-2">
          <span className="text-[28px] font-bold">{ethAmount} ETH</span>
          {quote && (
            <span className="text-lg">
              ≈ {formatNumberWithCommas(parseFloat(quote).toFixed(4))} {tokenSymbol}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Show loading state while fetching token data
  if (isLoading) {
    return (
      <StyleRoot>
        <div className="b3-root b3-modal bg-b3-react-background flex w-full flex-col items-center p-8">
          <p className="text-as-primary/70 text-center text-sm">Loading payment information...</p>
        </div>
      </StyleRoot>
    );
  }

  // If we don't have token data after loading, show error state
  if (!dstToken || isTokenError) {
    return (
      <StyleRoot>
        <div className="b3-root b3-modal bg-b3-react-background flex w-full flex-col items-center p-8">
          <p className="text-as-red text-center text-sm">
            Failed to fetch native token information for chain {baseMainnet.id}. Please try again.
          </p>
        </div>
      </StyleRoot>
    );
  }

  if (showAmountPrompt) {
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
              className="mb-4 flex justify-center"
            >
              {imageUrl && (
                <div className="relative size-16">
                  <div className="absolute inset-0 scale-95 rounded-[50%] bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl"></div>
                  <GlareCardRounded className="overflow-hidden rounded-full border-none bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm">
                    <img alt="token preview" className="size-full rounded-lg object-cover" src={imageUrl} />
                    <div className="absolute inset-0 rounded-[50%] border border-white/20"></div>
                  </GlareCardRounded>
                </div>
              )}
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
              <h2 className="font-sf-rounded text-as-primary mb-4 text-2xl font-bold">Buy {tokenName}</h2>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-as-primary/70 text-sm font-medium">Amount in ETH</p>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.1"
                  value={ethAmount}
                  onChange={e => validateAndSetAmount(e.target.value)}
                  className={`h-14 px-4 text-lg ${!isAmountValid && ethAmount ? "border-as-red" : "border-b3-react-border"}`}
                />
              </div>

              {!isAmountValid && ethAmount && <p className="text-as-red text-sm">{validationError}</p>}

              <div className="bg-as-on-surface-2/30 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-as-primary/70 text-sm font-medium">Total Cost:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-as-primary text-lg font-bold">{ethAmount || "0"} ETH</span>
                  </div>
                </div>
                {isLoadingQuote ? (
                  <div className="mt-2 text-center">
                    <span className="text-as-primary/70 text-sm">Calculating tokens...</span>
                  </div>
                ) : quote ? (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-as-primary/70 text-sm font-medium">You'll receive:</span>
                    <span className="text-as-primary text-sm font-medium">
                      ≈ {formatNumberWithCommas(parseFloat(quote).toFixed(4))} {tokenSymbol}
                    </span>
                  </div>
                ) : null}
              </div>

              <Button
                onClick={() => {
                  if (isAmountValid && ethAmount) {
                    setShowAmountPrompt(false);
                  }
                }}
                disabled={!isAmountValid || !ethAmount || isLoadingQuote}
                className="bg-as-brand hover:bg-as-brand/90 text-as-primary mt-4 h-14 w-full rounded-xl text-lg font-medium"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        </div>
      </StyleRoot>
    );
  }

  const encodedData = encodeFunctionData({
    abi: ABI_bondKit,
    functionName: "buyFor",
    args: [recipientAddress as `0x${string}`, BigInt(minTokensOut)],
  });

  // Ensure ETH amount is valid before proceeding
  const ethValue = parseEther(ethAmount);
  if (ethValue <= 0n) {
    console.error("Invalid ETH amount for buyFor:", ethAmount);
    return null;
  }

  return (
    <AnySpendCustom
      isMainnet={true}
      mode={mode}
      recipientAddress={recipientAddress}
      orderType={OrderType.Custom}
      dstChainId={baseMainnet.id}
      dstToken={dstToken}
      dstAmount={ethValue.toString()}
      contractAddress={contractAddress}
      encodedData={encodedData}
      metadata={{
        type: OrderType.Custom,
        action: "BondKit Buy",
      }}
      header={header}
      onSuccess={onSuccess}
      showRecipient={true}
    />
  );
}
