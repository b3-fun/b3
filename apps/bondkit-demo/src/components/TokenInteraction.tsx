"use client";

import { TokenChart } from "@/components/TokenChart";
import { useBondkit } from "@/hooks/useBondkit";
import { Action, TokenInteractionProps } from "@/types";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function TokenInteraction({
  tokenAddress,
  onUnmount,
}: TokenInteractionProps) {
  const { address: userAddress, isConnected } = useAccount();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const {
    tokenSymbol,
    currentPhase,
    tokenBalance,
    userEthBalance,
    getBuyQuote,
    getSellQuote,
    approve,
    sell,
    migrateToDex,
    isPending,
    hash,
    txType,
    isConfirmed,
    allowance,
    bondingProgress,
    holders,
    owner,
  } = useBondkit(tokenAddress);

  const [action, setAction] = useState<Action>("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [sellAmountToProcess, setSellAmountToProcess] = useState<bigint | null>(
    null
  );

  const needsApproval = useMemo(() => {
    if (action !== "sell" || !amount) return false;
    const parsedAmount = parseEther(amount);
    return parsedAmount > (allowance || BigInt(0));
  }, [action, amount, allowance]);

  const debouncedGetQuote = useMemo(
    () =>
      debounce(async (val: string, currentAction: Action) => {
        if (!val || Number(val) <= 0) {
          setQuote(null);
          return;
        }
        const parsedAmount = parseEther(val);
        if (currentAction === "buy") {
          const buyQuote = await getBuyQuote(parsedAmount);
          setQuote(buyQuote ? formatEther(buyQuote) : null);
        } else {
          const sellQuote = await getSellQuote(parsedAmount);
          setQuote(sellQuote ? formatEther(sellQuote) : null);
        }
      }, 500),
    [getBuyQuote, getSellQuote]
  );

  useEffect(() => {
    debouncedGetQuote(amount, action);
  }, [amount, action, debouncedGetQuote]);

  useEffect(() => {
    if (isConfirmed && txType === "approve" && sellAmountToProcess) {
      sell(sellAmountToProcess);
      setSellAmountToProcess(null);
    }
  }, [isConfirmed, txType, sell, sellAmountToProcess]);

  const handleAction = async () => {
    if (!amount) return;
    const parsedAmount = parseEther(amount);
    if (action === "buy") {
      setB3ModalOpen(true);
      setB3ModalContentType({
        type: "anySpendBondKit",
        recipientAddress: userAddress || "",
        contractAddress: tokenAddress,
        minTokensOut: quote || "0",
      });
    } else {
      if (needsApproval) {
        setSellAmountToProcess(parsedAmount);
        approve(parsedAmount);
      } else {
        sell(parsedAmount);
      }
    }
  };

  const buttonText = () => {
    if (!isConnected) return "Please Connect";
    if (isPending) return "Processing...";
    if (action === "sell") {
      if (needsApproval) return `Approve ${tokenSymbol || "Token"}`;
      return "Sell Token";
    }
    return "Buy with AnySpend";
  };

  const isOwner = useMemo(() => {
    if (!owner || !userAddress) return false;
    return (owner as string).toLowerCase() === userAddress.toLowerCase();
  }, [owner, userAddress]);

  return (
    <div className="w-full bg-gray-800 rounded-lg p-6 shadow-lg relative">
      <button
        onClick={onUnmount}
        className="absolute top-3 right-3 text-gray-500 hover:text-white"
      >
        &times;
      </button>
      <h2 className="text-xl font-semibold mb-2">Interact with Token</h2>
      <p className="text-center text-xs text-gray-400 mb-4 break-all">
        <a
          href={`https://basescan.org/address/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {tokenAddress}
        </a>
      </p>

      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Token Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Current Phase</p>
            <p className="font-bold">{currentPhase || "Loading..."}</p>
          </div>
          <div>
            <p className="text-gray-400">Your Balance</p>
            <p className="font-bold">
              {tokenBalance ? formatEther(tokenBalance) : "0.0"}{" "}
              {tokenSymbol || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Token Price Chart */}
      <div className="mb-4">
        <TokenChart tokenAddress={tokenAddress} chainId={8453} />
      </div>

      {currentPhase === "Bonding" && bondingProgress && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Bonding Progress</h3>
            <div className="w-full bg-gray-600 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full"
                style={{ width: `${bondingProgress.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>{formatEther(bondingProgress.raised)} ETH</span>
              <span>{bondingProgress.progress.toFixed(2)}%</span>
              <span>{formatEther(bondingProgress.threshold)} ETH</span>
            </div>
          </div>

          {bondingProgress.progress < 100 ? (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-center mb-4 border-b border-gray-600">
                <button
                  className={`px-6 py-2 font-semibold ${
                    action === "buy"
                      ? "border-b-2 border-blue-500 text-white"
                      : "text-gray-500"
                  }`}
                  onClick={() => setAction("buy")}
                >
                  Buy
                </button>
                <button
                  className={`px-6 py-2 font-semibold ${
                    action === "sell"
                      ? "border-b-2 border-blue-500 text-white"
                      : "text-gray-500"
                  }`}
                  onClick={() => setAction("sell")}
                >
                  Sell
                </button>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>
                    {action === "buy"
                      ? "You pay (ETH)"
                      : `You sell (${tokenSymbol || ""})`}
                  </span>
                  <span>
                    Balance:{" "}
                    {action === "buy"
                      ? `${
                          userEthBalance
                            ? parseFloat(
                                formatEther(userEthBalance.value)
                              ).toFixed(4)
                            : "0.0"
                        } ETH`
                      : `${tokenBalance ? formatEther(tokenBalance) : "0.0"}`}
                  </span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Amount`}
                  className="w-full bg-gray-600 text-white p-2 rounded-md mb-4"
                />
                {quote && (
                  <p className="text-sm text-gray-400 mb-2">
                    You will receive ≈ {parseFloat(quote).toFixed(4)}{" "}
                    {action === "buy" ? tokenSymbol : "ETH"}
                  </p>
                )}
                <button
                  onClick={handleAction}
                  disabled={isPending || !isConnected || !amount}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                >
                  {buttonText()}
                </button>
                {hash && (
                  <p className="mt-2 text-center text-xs break-all">
                    Tx: {hash}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Bonding Complete!</h2>
              <p className="text-gray-400">
                The bonding phase has reached its goal. Waiting for the admin to
                migrate liquidity to the DEX.
              </p>
            </div>
          )}
        </>
      )}
      {currentPhase === "Trading" && (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Trading Phase</h2>
          <p className="text-gray-400">This token has migrated to a DEX.</p>
        </div>
      )}

      {isOwner &&
        currentPhase === "Bonding" &&
        bondingProgress.progress >= 100 && (
          <div className="bg-gray-700 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Admin Actions</h3>
            <p className="text-sm text-gray-400 mb-4">
              As the token owner, you can now migrate the funds to create a
              liquidity pool on the DEX.
            </p>
            <button
              onClick={() => migrateToDex()}
              disabled={isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded"
            >
              {isPending && txType === "migrate"
                ? "Migrating..."
                : "Migrate to DEX"}
            </button>
          </div>
        )}

      {holders.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Token Holders</h3>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2">
                    Holder
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {holders.map((holder) => (
                  <tr key={holder.address} className="border-b border-gray-600">
                    <td className="px-4 py-2">
                      <a
                        href={`https://basescan.org/address/${holder.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {`${holder.address.slice(
                          0,
                          6
                        )}...${holder.address.slice(-4)}`}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {holder.percentage.toFixed(4)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
