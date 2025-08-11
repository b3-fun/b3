import { BondkitToken, BondkitTokenABI, TokenDetails } from "@b3dotfun/sdk/bondkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Address } from "viem";
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const REFETCH_INTERVAL = 5000; // 5 seconds

export function useBondkit(tokenAddress: `0x${string}`) {
  const { address: userAddress, isConnected } = useAccount();
  const { data: hash, isPending, writeContract, reset } = useWriteContract();

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
  const [txType, setTxType] = useState<"approve" | "sell" | "buy" | "migrate" | null>(null);
  const [bondingProgress, setBondingProgress] = useState({
    progress: 0,
    raised: BigInt(0),
    threshold: BigInt(0),
  });
  const [holders, setHolders] = useState<{ address: Address; balance: bigint; percentage: number }[]>([]);

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

  // Data fetching logic
  const fetchDynamicData = useCallback(async () => {
    if (!bondkitTokenClient || !userAddress) return;

    const [phase, balance, currentAllowance, progress, allHolders, details] = await Promise.all([
      bondkitTokenClient.getCurrentPhase(),
      bondkitTokenClient.balanceOf(userAddress),
      bondkitTokenClient.allowance(userAddress, tokenAddress),
      bondkitTokenClient.getBondingProgress(),
      fetchAllHolders(bondkitTokenClient),
      bondkitTokenClient.getTokenDetails(),
    ]);

    setCurrentPhase(phase || undefined);
    setTokenBalance(balance || BigInt(0));
    setAllowance(currentAllowance || BigInt(0));
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
    setHolders(allHolders);
    setTokenDetails(details || null);
  }, [bondkitTokenClient, userAddress, tokenAddress]);

  // Initial and interval fetching
  useEffect(() => {
    if (isConnected) {
      fetchDynamicData(); // initial fetch
      const interval = setInterval(() => {
        fetchDynamicData();
      }, REFETCH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchDynamicData]);

  // Quotes
  const getBuyQuote = useCallback(
    async (ethAmount: bigint) => {
      if (!bondkitTokenClient) return;
      return bondkitTokenClient.getAmountOfTokensToBuy(ethAmount);
    },
    [bondkitTokenClient],
  );

  const getSellQuote = useCallback(
    async (tokenAmount: bigint) => {
      if (!bondkitTokenClient) return;
      return bondkitTokenClient.getAmountOfEthToSell(tokenAmount);
    },
    [bondkitTokenClient],
  );

  // Write Actions
  const buy = (ethAmount: bigint) => {
    setTxType("buy");
    writeContract({
      abi: BondkitTokenABI,
      address: tokenAddress,
      functionName: "buy",
      args: [BigInt(0)], // Slippage protection, 0 for demo
      value: ethAmount,
    });
  };

  const approve = (tokenAmount: bigint) => {
    setTxType("approve");
    writeContract({
      abi: BondkitTokenABI,
      address: tokenAddress,
      functionName: "approve",
      args: [tokenAddress, tokenAmount],
    });
  };

  const sell = (tokenAmount: bigint) => {
    setTxType("sell");
    writeContract({
      abi: BondkitTokenABI,
      address: tokenAddress,
      functionName: "sell",
      args: [tokenAmount, BigInt(0)], // Slippage protection, 0 for demo
    });
  };

  const migrateToDex = () => {
    setTxType("migrate");
    writeContract({
      abi: BondkitTokenABI,
      address: tokenAddress,
      functionName: "migrateToDex",
    });
  };

  // Refetch balances after a transaction
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isConfirmed) {
      refetchEthBalance();
      fetchDynamicData();
      reset();
    }
  }, [isConfirmed, refetchEthBalance, fetchDynamicData, reset]);

  return {
    // Data
    tokenName: tokenDetails?.name,
    tokenSymbol: tokenDetails?.symbol,
    tokenBalance,
    userEthBalance,
    currentPhase,
    allowance,
    owner: ownerAddress,

    // Quotes
    getBuyQuote,
    getSellQuote,

    // Write Actions
    buy,
    approve,
    sell,
    migrateToDex,

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
