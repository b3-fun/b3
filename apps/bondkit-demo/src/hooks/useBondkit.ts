import { TokenPhase } from "@/types";
import { BondkitToken, BondkitTokenABI, TokenDetails } from "@b3dotfun/sdk/bondkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, Hex } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";

const REFETCH_INTERVAL = 5000; // 5 seconds

export function useBondkit(tokenAddress: `0x${string}`) {
  const { address: userAddress, isConnected } = useAccount();
  const [hash, setHash] = useState<Hex | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { data: userEthBalance, refetch: refetchEthBalance } = useBalance({
    address: userAddress,
    query: {
      refetchInterval: REFETCH_INTERVAL,
    },
  });

  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>();
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [txType, setTxType] = useState<"approve" | "sell" | "buy" | "migrate" | "swap" | null>(null);
  const [tradingTokenBalance, setTradingTokenBalance] = useState<bigint>(BigInt(0));
  const [tradingTokenAddress, setTradingTokenAddress] = useState<Address | undefined>();
  const [tradingTokenSymbol, setTradingTokenSymbol] = useState<string | undefined>();
  const [isStaticDataInitialized, setIsStaticDataInitialized] = useState(false);
  const [bondingProgress, setBondingProgress] = useState({
    progress: 0,
    raised: BigInt(0),
    threshold: BigInt(0),
  });
  const [holders, setHolders] = useState<{ address: Address; balance: bigint; percentage: number }[]>([]);
  const [isSwapAvailable, setIsSwapAvailable] = useState<boolean>(false);

  const { data: ownerAddress } = useReadContract({
    address: tokenAddress,
    abi: BondkitTokenABI,
    functionName: "owner",
    query: {
      staleTime: Infinity,
    },
  });

  const bondkitTokenClient = useMemo(() => {
    if (!tokenAddress) return null;
    try {
      const client = new BondkitToken(tokenAddress);
      client.connect();
      return client;
    } catch (error) {
      console.error("Error creating bondkit client", error);
      return null;
    }
  }, [tokenAddress]);

  // Connect SDK client with injected wallet provider to enable writes without private key
  useEffect(() => {
    if (!bondkitTokenClient) return;
    if (typeof window === "undefined") return;
    const provider = (window as any).ethereum;
    if (!provider) return;
    bondkitTokenClient.connectWithProvider(provider);
  }, [bondkitTokenClient]);

  // Static data fetching logic (fetch once)
  const fetchStaticData = useCallback(async () => {
    if (!bondkitTokenClient || isStaticDataInitialized) return;

    try {
      // Fetch static data that never changes
      const [details, tradingTokenAddr] = await Promise.all([
        bondkitTokenClient.getTokenDetails(),
        bondkitTokenClient.getTradingTokenAddress(),
      ]);

      // Get trading token symbol using the address we just fetched
      const tradingTokenSym = await bondkitTokenClient.getTradingTokenSymbol(tradingTokenAddr);

      // Set static data
      setTokenDetails(details || null);
      setTradingTokenAddress(tradingTokenAddr);
      setTradingTokenSymbol(tradingTokenSym);

      // Mark static data as initialized
      setIsStaticDataInitialized(true);
    } catch (error) {
      console.error("Error fetching static data:", error);
    }
  }, [bondkitTokenClient, isStaticDataInitialized]);

  // Dynamic data fetching logic
  const fetchDynamicData = useCallback(async () => {
    if (!bondkitTokenClient || !userAddress) return;

    // First, get the current phase to determine what data to fetch
    const phase = await bondkitTokenClient.getCurrentPhase();
    const isDexPhase = phase === TokenPhase.DEX;

    // Fetch dynamic data that changes with user actions
    const [balance, currentAllowance, allHolders, tradingTokenBal] = await Promise.all([
      bondkitTokenClient.balanceOf(userAddress),
      bondkitTokenClient.allowance(userAddress, tokenAddress),
      fetchAllHolders(bondkitTokenClient),
      bondkitTokenClient.getTradingTokenBalanceOf(userAddress),
    ]);

    // Set dynamic data
    setCurrentPhase(phase || undefined);
    setTokenBalance(balance || BigInt(0));
    setAllowance(currentAllowance || BigInt(0));
    setTradingTokenBalance(tradingTokenBal || BigInt(0));
    setHolders(allHolders);

    // Handle phase-specific data
    if (!isDexPhase) {
      // Bonding phase: fetch bonding progress
      const progress = await bondkitTokenClient.getBondingProgress();
      if (progress) {
        setBondingProgress({
          progress: progress.progress,
          raised: BigInt(progress.raised),
          threshold: BigInt(progress.threshold),
        });
      } else {
        setBondingProgress({
          progress: 0,
          raised: BigInt(0),
          threshold: BigInt(0),
        });
      }
      setIsSwapAvailable(false); // Always false in bonding phase
    } else {
      // DexPhase: fetch swap availability
      const swapAvailable = await bondkitTokenClient.isSwapAvailable();
      setIsSwapAvailable(swapAvailable || false);
      // Clear bonding progress for DexPhase
      setBondingProgress({
        progress: 100, // Completed
        raised: BigInt(0),
        threshold: BigInt(0),
      });
    }
  }, [bondkitTokenClient, userAddress, tokenAddress]);

  // Static data fetching (only once)
  useEffect(() => {
    if (bondkitTokenClient) {
      fetchStaticData();
    }
  }, [bondkitTokenClient, fetchStaticData]);

  // Dynamic data fetching with interval
  useEffect(() => {
    if (isConnected && isStaticDataInitialized) {
      fetchDynamicData(); // initial fetch
      const interval = setInterval(() => {
        fetchDynamicData();
      }, REFETCH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isConnected, isStaticDataInitialized, fetchDynamicData]);

  // Quotes
  const getBuyQuote = useCallback(
    async (tradingTokenAmount: bigint) => {
      if (!bondkitTokenClient) return;
      return bondkitTokenClient.getAmountOfTokensToBuy(tradingTokenAmount);
    },
    [bondkitTokenClient],
  );

  const getSellQuote = useCallback(
    async (tokenAmount: bigint) => {
      if (!bondkitTokenClient) return;
      return bondkitTokenClient.getAmountOfTradingTokensToSell(tokenAmount);
    },
    [bondkitTokenClient],
  );

  // Swap Quotes
  const getSwapQuoteForBondkit = useCallback(
    async (tradingTokenAmount: string, slippage?: number) => {
      if (!bondkitTokenClient || !isSwapAvailable || currentPhase !== TokenPhase.DEX) return;
      return bondkitTokenClient.getSwapQuoteForBondkitToken(tradingTokenAmount, slippage);
    },
    [bondkitTokenClient, isSwapAvailable, currentPhase],
  );

  const getSwapQuoteForTrading = useCallback(
    async (bondkitTokenAmount: string, slippage?: number) => {
      if (!bondkitTokenClient || !isSwapAvailable || currentPhase !== TokenPhase.DEX) return;
      return bondkitTokenClient.getSwapQuoteForTradingToken(bondkitTokenAmount, slippage);
    },
    [bondkitTokenClient, isSwapAvailable, currentPhase],
  );

  // Write Actions
  const buy = async (tradingTokenAmount: bigint) => {
    if (!bondkitTokenClient) return;
    setTxType("buy");
    setIsConfirmed(false);
    setIsPending(true);
    try {
      const tx = await bondkitTokenClient.buy(tradingTokenAmount, BigInt(0));
      if (tx) {
        setHash(tx);
        await bondkitTokenClient.publicClient.waitForTransactionReceipt({ hash: tx });
        setIsConfirmed(true);
      }
    } finally {
      setIsPending(false);
    }
  };

  const approve = async (tokenAmount: bigint) => {
    if (!bondkitTokenClient) return;
    setTxType("approve");
    setIsConfirmed(false);
    setIsPending(true);
    try {
      const tx = await bondkitTokenClient.approve(tokenAddress as Address, tokenAmount);
      if (tx) {
        setHash(tx);
        await bondkitTokenClient.publicClient.waitForTransactionReceipt({ hash: tx });
        setIsConfirmed(true);
      }
    } finally {
      setIsPending(false);
    }
  };

  const sell = async (tokenAmount: bigint) => {
    if (!bondkitTokenClient) return;
    setTxType("sell");
    setIsConfirmed(false);
    setIsPending(true);
    try {
      const tx = await bondkitTokenClient.sell(tokenAmount, BigInt(0));
      if (tx) {
        setHash(tx);
        await bondkitTokenClient.publicClient.waitForTransactionReceipt({ hash: tx });
        setIsConfirmed(true);
      }
    } finally {
      setIsPending(false);
    }
  };

  const migrateToDex = async () => {
    if (!bondkitTokenClient) return;
    setTxType("migrate");
    setIsConfirmed(false);
    setIsPending(true);
    try {
      const tx = await bondkitTokenClient.migrateToDex();
      if (tx) {
        setHash(tx);
        await bondkitTokenClient.publicClient.waitForTransactionReceipt({ hash: tx });
        setIsConfirmed(true);
      }
    } finally {
      setIsPending(false);
    }
  };

  // Swap Actions
  const swapTradingToBondkit = async (tradingTokenAmount: string, slippage?: number) => {
    console.log("swapTradingToBondkit", tradingTokenAmount, isSwapAvailable, currentPhase);
    if (!bondkitTokenClient || !isSwapAvailable || currentPhase !== TokenPhase.DEX) return;
    setTxType("swap");
    setIsConfirmed(false);
    setIsPending(true);
    try {
      const tx = await bondkitTokenClient.swapTradingTokenForBondkitToken(tradingTokenAmount, slippage);
      if (tx) {
        setHash(tx);
        await bondkitTokenClient.publicClient.waitForTransactionReceipt({ hash: tx });
        setIsConfirmed(true);
      }
    } finally {
      setIsPending(false);
    }
  };

  const swapBondkitToTrading = async (bondkitTokenAmount: string, slippage?: number) => {
    if (!bondkitTokenClient || !isSwapAvailable || currentPhase !== TokenPhase.DEX) return;
    setTxType("swap");
    setIsConfirmed(false);
    setIsPending(true);
    try {
      const tx = await bondkitTokenClient.swapBondkitTokenForTradingToken(bondkitTokenAmount, slippage);
      if (tx) {
        setHash(tx);
        await bondkitTokenClient.publicClient.waitForTransactionReceipt({ hash: tx });
        setIsConfirmed(true);
      }
    } finally {
      setIsPending(false);
    }
  };

  // Refetch balances after a transaction
  useEffect(() => {
    if (isConfirmed) {
      refetchEthBalance();
      fetchDynamicData();
    }
  }, [isConfirmed, refetchEthBalance, fetchDynamicData]);

  // Computed values to prevent redundant calculations in components
  const isEthTradingToken = tradingTokenAddress === "0x0000000000000000000000000000000000000000";
  const computedTradingTokenSymbol = tradingTokenSymbol || (isEthTradingToken ? "ETH" : "B3"); // fallback for loading state
  const userTradingTokenBalance = isEthTradingToken ? userEthBalance?.value : tradingTokenBalance;

  return {
    // Data
    tokenName: tokenDetails?.name,
    tokenSymbol: tokenDetails?.symbol,
    tokenBalance,
    userEthBalance,
    tradingTokenBalance,
    tradingTokenAddress,
    currentPhase,
    allowance,
    owner: ownerAddress,
    isSwapAvailable,

    // Computed values
    isEthTradingToken,
    tradingTokenSymbol: computedTradingTokenSymbol,
    userTradingTokenBalance,

    // Quotes
    getBuyQuote,
    getSellQuote,
    getSwapQuoteForBondkit,
    getSwapQuoteForTrading,

    // Write Actions
    buy,
    approve,
    sell,
    migrateToDex,
    swapTradingToBondkit,
    swapBondkitToTrading,

    // Tx State
    isPending,
    isConfirmed,
    hash,
    txType,
    bondingProgress,
    holders,
  };
}

async function fetchAllHolders(client: BondkitToken) {
  let startIndex = BigInt(0);
  const holders: { address: Address; balance: bigint; percentage: number }[] = [];
  const totalSupply = await client.totalSupply();
  if (totalSupply === BigInt(0)) {
    return [];
  }
  while (true) {
    const paginatedHolders = await client.getPaginatedHolders(startIndex, BigInt(1000));
    holders.push(
      ...paginatedHolders.map((holder: { address: Address; balance: bigint }) => ({
        ...holder,
        percentage: (Number(holder.balance) * 100) / Number(totalSupply),
      })),
    );
    if (paginatedHolders.length < 1000) {
      break;
    }
    startIndex += BigInt(1000);
  }
  return holders.filter(holder => holder.balance > BigInt(0)).sort((a, b) => b.percentage - a.percentage);
}
