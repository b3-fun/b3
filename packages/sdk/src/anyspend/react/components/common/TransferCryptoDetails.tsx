"use client";

import { ALL_CHAINS, getChainName, getPaymentUrl, RELAY_ETH_ADDRESS } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { Badge, CopyToClipboard, ShinyButton, TextLoop } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { WalletCoinbase, WalletMetamask, WalletPhantom, WalletTrust } from "@web3icons/react";
import { ArrowLeft, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { b3 } from "viem/chains";
import { OrderDetailsCollapsible } from "./OrderDetailsCollapsible";

type Order = components["schemas"]["Order"];
type Token = components["schemas"]["Token"];
type Tournament = components["schemas"]["Tournament"];
type NFT = components["schemas"]["NFT"];

interface TransferCryptoDetailsProps {
  order: Order;
  srcToken: Token;
  dstToken: Token;
  tournament?: Tournament;
  nft?: NFT;
  onBack: () => void;
  recipientName?: string;
}

export const TransferCryptoDetails = memo(function TransferCryptoDetails({
  order,
  srcToken,
  dstToken,
  tournament,
  nft,
  onBack,
  recipientName,
}: TransferCryptoDetailsProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const roundedUpSrcAmount = useMemo(() => {
    // Display the full transfer amount without rounding since users need to see the exact value they're transferring.
    // Use 21 significant digits (max allowed by Intl.NumberFormat)
    const formattedSrcAmount = srcToken
      ? formatTokenAmount(BigInt(order.srcAmount), srcToken.decimals, 21, false)
      : undefined;

    // Simple function to round up the amount (you may need to implement this based on your utils)
    return formattedSrcAmount;
  }, [order.srcAmount, srcToken]);

  const expectedDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? "0"
      : order.payload.expectedDstAmount.toString();
  const formattedExpectedDstAmount = formatTokenAmount(BigInt(expectedDstAmount), dstToken.decimals);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(order.globalAddress);
    toast.success("Deposit address copied to clipboard");
  };

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-as-primary/60 hover:text-as-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h2 className="text-as-primary text-xl font-semibold">Transfer crypto</h2>

        {/* Countdown Timer */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              className="text-blue-500"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeft / (15 * 60))}`}
              style={{
                transition: "stroke-dashoffset 1s linear",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-as-primary text-sm font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="flex w-full flex-col gap-4">
        {/* Amount and Chain Card */}
        <div className="bg-b3-react-background border-b3-react-border rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Amount Section */}
            <div className="flex flex-col gap-1">
              <span className="text-as-primary/60 text-sm">Amount</span>
              <CopyToClipboard
                text={roundedUpSrcAmount || ""}
                onCopy={() => {
                  toast.success("Amount copied to clipboard");
                }}
              >
                <div className="flex cursor-pointer items-center gap-2">
                  <strong className="text-as-primary text-lg font-semibold">
                    {roundedUpSrcAmount} {srcToken.symbol}
                  </strong>
                  <Copy className="text-as-primary/50 hover:text-as-primary h-4 w-4 transition-all duration-200" />
                </div>
              </CopyToClipboard>
            </div>

            {/* Chain Section */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-as-primary/60 text-sm">Chain</span>
              <Badge variant="outline" className="flex h-8 items-center gap-2 px-3 py-1 text-sm">
                <img
                  src={ALL_CHAINS[order.srcChain].logoUrl}
                  alt={getChainName(order.srcChain)}
                  className={cn("h-5 rounded-full", order.srcChain === b3.id && "h-4 rounded-none")}
                />
                {getChainName(order.srcChain)}
              </Badge>
            </div>
          </div>
        </div>

        {/* QR Code and Deposit Address Card */}
        <div className="bg-b3-react-background border-b3-react-border rounded-xl border p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            {/* QR Code Section */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center rounded-lg bg-white p-6">
                <QRCodeSVG
                  value={getPaymentUrl(
                    order.globalAddress,
                    BigInt(order.srcAmount),
                    order.srcTokenAddress === RELAY_ETH_ADDRESS ? "ETH" : order.srcTokenAddress,
                  )}
                  className="h-48 w-48"
                />
                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                  <span className="text-as-brand/70 text-sm font-medium">SCAN WITH</span>
                  <TextLoop interval={3}>
                    <WalletMetamask className="h-5 w-5" variant="branded" />
                    <WalletCoinbase className="h-5 w-5" variant="branded" />
                    <WalletPhantom className="h-5 w-5" variant="branded" />
                    <WalletTrust className="h-5 w-5" variant="branded" />
                  </TextLoop>
                </div>
              </div>
            </div>

            {/* Deposit Address Section */}
            <div className="flex flex-col gap-2">
              <span className="text-as-primary/60 text-sm">Deposit address:</span>
              <div
                className="bg-b3-react-background border-b3-react-border hover:border-as-brand group flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 px-4 shadow-sm transition-all duration-200"
                onClick={handleCopyAddress}
              >
                <div className="text-as-primary overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm">
                  {order.globalAddress}
                </div>
                <Copy className="group-hover:text-as-brand text-as-primary/50 h-5 w-5 cursor-pointer transition-all duration-200" />
              </div>
            </div>
          </div>
        </div>

        <OrderDetailsCollapsible
          order={order}
          dstToken={dstToken}
          tournament={tournament}
          nft={nft}
          recipientName={recipientName}
          formattedExpectedDstAmount={formattedExpectedDstAmount}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <ShinyButton
          accentColor="hsl(var(--as-brand))"
          textColor="text-white"
          className="w-full py-3"
          onClick={handleCopyAddress}
        >
          Copy deposit address
        </ShinyButton>

        {/* <button
          className="text-as-primary/60 hover:text-as-primary flex w-full items-center justify-center gap-2 py-2 transition-colors"
          onClick={onBack}
        >
          <RefreshCcw className="h-4 w-4" />
          Cancel and start over
        </button> */}
      </div>
    </div>
  );
});
