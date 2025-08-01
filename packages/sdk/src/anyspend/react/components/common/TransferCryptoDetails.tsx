"use client";

import { ALL_CHAINS, getChainName, getPaymentUrl, RELAY_ETH_ADDRESS } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { CopyToClipboard, ShinyButton, TextLoop } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { WalletCoinbase, WalletMetamask, WalletPhantom, WalletTrust } from "@web3icons/react";
import { ChevronLeft, Copy } from "lucide-react";
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
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!order.expiredAt) return 0;
      const now = Date.now();
      const expiredAt = new Date(order.expiredAt).getTime();
      const diff = Math.max(0, Math.floor((expiredAt - now) / 1000));
      return diff;
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [order.expiredAt]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const totalTime = useMemo(() => {
    if (!order.expiredAt) return 15 * 60; // fallback to 15 minutes
    const now = Date.now();
    const expiredAt = new Date(order.expiredAt).getTime();
    const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : now;
    return Math.max(0, Math.floor((expiredAt - createdAt) / 1000));
  }, [order.expiredAt, order.createdAt]);

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
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-as-primary/60 hover:text-as-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-as-quaternary" />
        </button>

        <h2 className="text-as-primary text-lg font-semibold">Transfer crypto</h2>

        {/* Countdown Timer */}
        <div className="relative flex h-11 w-11 items-center justify-center">
          <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="text-blue-500"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - timeLeft / totalTime)}`}
              style={{
                transition: "stroke-dashoffset 1s linear",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-as-primary text-[10px] font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="flex w-full flex-col gap-4">
        {/* Amount Card */}
        <div className="flex items-center gap-4">
          <div className="w-full">
            <span className="text-as-content-secondary text-sm font-medium">Amount</span>
            <div className="border-as-border-primary rounded-lg border p-2 shadow-sm">
              <CopyToClipboard
                text={roundedUpSrcAmount || ""}
                onCopy={() => {
                  toast.success("Amount copied to clipboard");
                }}
              >
                <div className="flex cursor-pointer items-center justify-between gap-2">
                  <strong className="text-as-primary font-semibold">
                    {roundedUpSrcAmount} {srcToken.symbol}
                  </strong>
                  <Copy className="text-as-primary/50 hover:text-as-primary h-4 w-4 transition-all duration-200" />
                </div>
              </CopyToClipboard>
            </div>
          </div>

          {/* Chain Card */}
          <div className="w-full">
            <span className="text-as-content-secondary text-sm font-medium">Chain</span>
            <div className="border-as-border-primary rounded-lg border p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <img
                  src={ALL_CHAINS[order.srcChain].logoUrl}
                  alt={getChainName(order.srcChain)}
                  className={cn("h-6 rounded-full", order.srcChain === b3.id && "h-5 rounded-none")}
                />
                <span className="text-as-primary text-sm font-semibold">{getChainName(order.srcChain)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code and Deposit Address Card */}
        <div className="border-b3-react-border bg-as-surface-secondary grid h-[220px] grid-cols-2 overflow-hidden rounded-xl border">
          {/* QR Code Section */}
          <div className="border-as-border-primary h-full w-full border-r">
            <div className="flex justify-center">
              <div className="bg-as-surface-secondary flex flex-col items-center rounded-lg p-6">
                <QRCodeSVG
                  value={getPaymentUrl(
                    order.globalAddress,
                    BigInt(order.srcAmount),
                    order.srcTokenAddress === RELAY_ETH_ADDRESS ? "ETH" : order.srcTokenAddress,
                  )}
                  className="bg-as-surface-secondary max-h-48 max-w-48"
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
          </div>

          {/* Deposit Address Section */}
          <div className="flex h-full w-full flex-col gap-2 p-6">
            <span className="text-as-content-secondary text-sm font-medium">Deposit address:</span>
            <div
              className="flex h-full cursor-pointer flex-col items-stretch justify-between gap-4"
              onClick={handleCopyAddress}
            >
              <div className="text-as-primary break-all font-mono text-sm font-semibold leading-relaxed">
                {order.globalAddress}
              </div>
              <div className="place-self-end">
                <Copy className="group-hover:text-as-brand text-as-tertiarry h-4 w-4 cursor-pointer transition-all duration-200" />
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
