"use client";

import { ALL_CHAINS, getChainName, getPaymentUrl, RELAY_ETH_ADDRESS } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { CopyToClipboard, ShinyButton, TextLoop, toast } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { WalletCoinbase, WalletMetamask, WalletPhantom, WalletTrust } from "@web3icons/react";
import { ChevronLeft, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { memo, useEffect, useMemo, useState } from "react";

import { b3 } from "viem/chains";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { OrderDetailsCollapsible } from "./OrderDetailsCollapsible";
import { PaymentMethodSwitch } from "./PaymentMethodSwitch";

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
  onPaymentMethodChange?: (method: CryptoPaymentMethodType) => void;
}

export const TransferCryptoDetails = memo(function TransferCryptoDetails({
  order,
  srcToken,
  dstToken,
  tournament,
  nft,
  onBack,
  recipientName,
  onPaymentMethodChange,
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
    <div className="order-transfer-crypto flex w-full flex-col gap-6">
      {/* Header */}
      <div className="order-transfer-crypto-header flex items-center justify-between">
        <button
          onClick={onBack}
          className="order-transfer-crypto-back-btn text-as-primary/60 hover:text-as-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-as-quaternary" />
        </button>

        <h2 className="order-transfer-crypto-title text-as-primary text-lg font-semibold">Transfer crypto</h2>

        {/* Countdown Timer */}
        <div className="order-transfer-crypto-timer relative flex h-11 w-11 items-center justify-center">
          <svg className="order-transfer-crypto-timer-svg h-11 w-11 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="order-transfer-crypto-timer-bg text-gray-200"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="order-transfer-crypto-timer-progress text-blue-500"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - timeLeft / totalTime)}`}
              style={{
                transition: "stroke-dashoffset 1s linear",
              }}
            />
          </svg>
          <div className="order-transfer-crypto-timer-text absolute inset-0 flex items-center justify-center">
            <span className="text-as-primary text-[10px] font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="order-transfer-crypto-content flex w-full flex-col gap-4">
        {/* Amount Card */}
        <div className="order-transfer-crypto-cards flex items-center gap-4">
          <div className="order-transfer-crypto-amount-card w-full">
            <span className="order-transfer-crypto-amount-label text-as-content-secondary text-sm font-medium">
              Amount
            </span>
            <div className="order-transfer-crypto-amount-container border-as-border-primary rounded-lg border p-2 shadow-sm">
              <CopyToClipboard
                text={roundedUpSrcAmount || ""}
                onCopy={() => {
                  toast.success("Amount copied to clipboard");
                }}
              >
                <div className="order-transfer-crypto-amount-copy flex cursor-pointer items-center justify-between gap-2">
                  <strong className="order-transfer-crypto-amount-text text-as-primary font-semibold">
                    {roundedUpSrcAmount} {srcToken.symbol}
                  </strong>
                  <Copy className="order-transfer-crypto-amount-copy-icon text-as-primary/50 hover:text-as-primary h-4 w-4 transition-all duration-200" />
                </div>
              </CopyToClipboard>
            </div>
          </div>

          {/* Chain Card */}
          <div className="order-transfer-crypto-chain-card w-full">
            <span className="order-transfer-crypto-chain-label text-as-content-secondary text-sm font-medium">
              Chain
            </span>
            <div className="order-transfer-crypto-chain-container border-as-border-primary rounded-lg border p-2 shadow-sm">
              <div className="order-transfer-crypto-chain-info flex items-center gap-2">
                <img
                  src={ALL_CHAINS[order.srcChain].logoUrl}
                  alt={getChainName(order.srcChain)}
                  className={cn(
                    "order-transfer-crypto-chain-logo h-6 rounded-full",
                    order.srcChain === b3.id && "h-5 rounded-none",
                  )}
                />
                <span className="order-transfer-crypto-chain-name text-as-primary text-sm font-semibold">
                  {getChainName(order.srcChain)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code and Deposit Address Card */}
        <div className="order-transfer-crypto-qr-deposit-card border-b3-react-border bg-as-surface-secondary grid h-[220px] grid-cols-2 overflow-hidden rounded-xl border">
          {/* QR Code Section */}
          <div className="order-transfer-crypto-qr-section border-as-border-primary h-full w-full border-r">
            <div className="order-transfer-crypto-qr-wrapper flex justify-center">
              <div className="order-transfer-crypto-qr-container bg-as-surface-secondary flex flex-col items-center rounded-lg p-6">
                <QRCodeSVG
                  value={getPaymentUrl(
                    order.globalAddress,
                    BigInt(order.srcAmount),
                    order.srcTokenAddress === RELAY_ETH_ADDRESS ? "ETH" : order.srcTokenAddress,
                    order.srcChain,
                    srcToken?.decimals,
                  )}
                  className="order-transfer-crypto-qr-code bg-as-surface-secondary max-h-48 max-w-48"
                />
                <div className="order-transfer-crypto-wallet-hint mt-3 flex items-center justify-center gap-2 text-sm">
                  <span className="order-transfer-crypto-wallet-text text-as-brand/70 text-sm font-medium">
                    SCAN WITH
                  </span>
                  <TextLoop interval={3}>
                    <WalletMetamask className="order-transfer-crypto-wallet-icon h-5 w-5" variant="branded" />
                    <WalletCoinbase className="order-transfer-crypto-wallet-icon h-5 w-5" variant="branded" />
                    <WalletPhantom className="order-transfer-crypto-wallet-icon h-5 w-5" variant="branded" />
                    <WalletTrust className="order-transfer-crypto-wallet-icon h-5 w-5" variant="branded" />
                  </TextLoop>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Address Section */}
          <div className="order-transfer-crypto-address-section flex h-full w-full flex-col gap-2 p-6">
            <span className="order-transfer-crypto-address-label text-as-content-secondary text-sm font-medium">
              Deposit address:
            </span>
            <div
              className="order-transfer-crypto-address-copy flex h-full cursor-pointer flex-col items-stretch justify-between gap-4"
              onClick={handleCopyAddress}
            >
              <div className="order-transfer-crypto-address-text text-as-primary break-all font-mono text-sm font-semibold leading-relaxed">
                {order.globalAddress}
              </div>
              <div className="order-transfer-crypto-address-copy-icon-wrapper place-self-end">
                <Copy className="order-transfer-crypto-address-copy-icon group-hover:text-as-brand text-as-tertiarry h-4 w-4 cursor-pointer transition-all duration-200" />
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
      <div className="order-transfer-crypto-actions flex flex-col gap-3">
        <ShinyButton
          accentColor="hsl(var(--as-brand))"
          textColor="text-white"
          className="order-transfer-crypto-copy-btn w-full py-3"
          onClick={handleCopyAddress}
        >
          Copy deposit address
        </ShinyButton>

        {/* <button
          className="order-transfer-crypto-cancel-btn text-as-primary/60 hover:text-as-primary flex w-full items-center justify-center gap-2 py-2 transition-colors"
          onClick={onBack}
        >
          <RefreshCcw className="h-4 w-4" />
          Cancel and start over
        </button> */}

        <PaymentMethodSwitch
          currentMethod={CryptoPaymentMethodType.TRANSFER_CRYPTO}
          onMethodChange={onPaymentMethodChange}
        />
      </div>
    </div>
  );
});
