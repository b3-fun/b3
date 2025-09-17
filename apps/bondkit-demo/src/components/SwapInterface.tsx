"use client";

import { useBondkit } from "@/hooks/useBondkit";
import type { SwapDirection } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

interface SwapInterfaceProps {
  tokenAddress: `0x${string}`;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function SwapInterface({ tokenAddress }: SwapInterfaceProps) {
  const { address: userAddress, isConnected } = useAccount();

  const {
    tokenSymbol,
    tokenBalance,
    tradingTokenSymbol,
    userTradingTokenBalance,
    isSwapAvailable,
    getSwapQuoteForBondkit,
    getSwapQuoteForTrading,
    swapTradingToBondkit,
    swapBondkitToTrading,
    isPending,
    hash,
    txType,
  } = useBondkit(tokenAddress);

  const [swapDirection, setSwapDirection] = useState<SwapDirection>("tradingToBondkit");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<string | null>(null);

  // Tab labels based on actual trading token
  const tab1Label = `${tradingTokenSymbol} → ${tokenSymbol}`;
  const tab2Label = `${tokenSymbol} → ${tradingTokenSymbol}`;

  // Current tab info
  const isTrading2Bondkit = swapDirection === "tradingToBondkit";
  const inputTokenSymbol = isTrading2Bondkit ? tradingTokenSymbol : tokenSymbol;
  const outputTokenSymbol = isTrading2Bondkit ? tokenSymbol : tradingTokenSymbol;
  const inputBalance = isTrading2Bondkit ? userTradingTokenBalance : tokenBalance;

  // Debounced quote fetching
  const debouncedGetQuote = useMemo(
    () =>
      debounce(async (val: string, direction: SwapDirection) => {
        if (!val || Number(val) <= 0 || !isSwapAvailable) {
          setQuote(null);
          return;
        }

        try {
          let quoteResult;
          if (direction === "tradingToBondkit") {
            quoteResult = await getSwapQuoteForBondkit(val, 0.5); // 0.5% slippage
          } else {
            quoteResult = await getSwapQuoteForTrading(val, 0.5);
          }

          setQuote(quoteResult ? quoteResult.amountOut : null);
        } catch (error) {
          console.warn("Error getting swap quote:", error);
          setQuote(null);
        }
      }, 500),
    [getSwapQuoteForBondkit, getSwapQuoteForTrading, isSwapAvailable],
  );

  useEffect(() => {
    debouncedGetQuote(amount, swapDirection);
  }, [amount, swapDirection, debouncedGetQuote]);

  const handleSwap = async () => {
    if (!amount || !isSwapAvailable) return;

    try {
      if (swapDirection === "tradingToBondkit") {
        console.log("swapTradingToBondkit", amount);
        await swapTradingToBondkit(amount, 0.5); // 0.5% slippage
      } else {
        console.log("swapBondkitToTrading", amount);
        await swapBondkitToTrading(amount, 0.5);
      }
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  const buttonText = () => {
    if (!isConnected) return "Please Connect";
    if (isPending && txType === "swap") return "Swapping...";
    return `Swap ${inputTokenSymbol} for ${outputTokenSymbol}`;
  };

  const formatBalance = (balance: bigint | undefined, decimals: number = 18) => {
    if (!balance) return "0.0";
    // Convert string to number for formatting, then back to display
    const balanceStr = balance.toString();
    const balanceNum = Number(balanceStr) / Math.pow(10, decimals);
    return balanceNum.toFixed(4);
  };

  if (!isSwapAvailable) {
    return (
      <div className="text-center">
        <h4 className="text-b3-react-foreground mb-2 text-lg font-semibold">Swap Not Available</h4>
        <p className="text-b3-react-muted-foreground">This token is not available for swapping yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Swap Direction Toggle - Same styling as Buy/Sell */}
      <div className="border-b3-react-border mb-4 flex justify-center border-b">
        <button
          className={`px-6 py-2 font-semibold transition-colors ${
            swapDirection === "tradingToBondkit"
              ? "border-b3-react-primary text-b3-react-foreground border-b-2"
              : "text-b3-react-muted-foreground hover:text-b3-react-foreground"
          }`}
          onClick={() => setSwapDirection("tradingToBondkit")}
        >
          {tab1Label}
        </button>
        <button
          className={`px-6 py-2 font-semibold transition-colors ${
            swapDirection === "bondkitToTrading"
              ? "border-b3-react-primary text-b3-react-foreground border-b-2"
              : "text-b3-react-muted-foreground hover:text-b3-react-foreground"
          }`}
          onClick={() => setSwapDirection("bondkitToTrading")}
        >
          {tab2Label}
        </button>
      </div>

      {/* Trading Form - Same styling as bonding interface */}
      <div>
        <div className="text-b3-react-muted-foreground mb-2 flex justify-between text-sm">
          <span>You pay ({inputTokenSymbol})</span>
          <span>
            Balance: {formatBalance(inputBalance)} {inputTokenSymbol}
          </span>
        </div>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount"
          className="bg-b3-react-subtle border-b3-react-border text-b3-react-foreground placeholder-b3-react-muted-foreground focus:border-b3-react-primary mb-4 w-full rounded-lg border p-3 focus:outline-none"
        />

        {/* Show both balances */}
        <div className="text-b3-react-muted-foreground mb-4 flex justify-between text-xs">
          <span>
            {tradingTokenSymbol} Balance: {formatBalance(userTradingTokenBalance)}
          </span>
          <span>
            {tokenSymbol} Balance: {formatBalance(tokenBalance)}
          </span>
        </div>

        {quote && (
          <p className="text-b3-react-muted-foreground mb-4 text-sm">
            You will receive ≈ {parseFloat(quote).toFixed(4)} {outputTokenSymbol}
          </p>
        )}

        <button
          onClick={handleSwap}
          disabled={isPending || !isConnected || !amount || !isSwapAvailable}
          className="bg-b3-react-primary text-b3-react-primary-foreground hover:bg-b3-react-primary/90 disabled:bg-b3-react-muted disabled:text-b3-react-muted-foreground w-full rounded-lg px-4 py-3 font-bold transition-colors"
        >
          {buttonText()}
        </button>

        {hash && txType === "swap" && (
          <p className="text-b3-react-muted-foreground mt-2 break-all text-center font-mono text-xs">Tx: {hash}</p>
        )}
      </div>
    </div>
  );
}
