"use client";

import {
  ALL_CHAINS,
  getChainName,
  getPaymentUrl,
  RELAY_ETH_ADDRESS,
  RELAY_SOLANA_MAINNET_CHAIN_ID,
} from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { Badge, CopyToClipboard, ShinyButton, TextLoop } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { b3 } from "viem/chains";

import { formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import { WalletCoinbase, WalletMetamask, WalletPhantom, WalletTrust } from "@web3icons/react";
import { ChevronRight, Copy, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

interface InsufficientDepositPaymentProps {
  order: components["schemas"]["Order"];
  srcToken: components["schemas"]["Token"];
  depositDeficit: bigint;
  phantomWalletAddress: string | null;
  txLoading: boolean;
  isSwitchingOrExecuting: boolean;
  onPayment: () => Promise<void>;
}

export function InsufficientDepositPayment({
  order,
  srcToken,
  depositDeficit,
  phantomWalletAddress,
  txLoading,
  isSwitchingOrExecuting,
  onPayment,
}: InsufficientDepositPaymentProps) {
  return (
    <div className="insufficient-deposit-payment relative flex w-full flex-1 flex-col">
      <div className="flex flex-col gap-1">
        <span className="insufficient-deposit-payment-text text-as-primary/50">Please send remaining</span>
        <div className="flex w-full flex-wrap items-center gap-6 sm:justify-between sm:gap-0">
          <CopyToClipboard
            text={formatUnits(depositDeficit.toString(), srcToken.decimals)}
            onCopy={() => {
              toast.success("Copied to clipboard");
            }}
          >
            <div className="flex items-center gap-2">
              <strong className="border-as-brand text-as-primary border-b-2 pb-1 text-2xl font-semibold sm:text-xl">
                {formatUnits(depositDeficit.toString(), srcToken.decimals)} {srcToken.symbol}
              </strong>
              <Copy className="text-as-primary/50 hover:text-as-primary h-5 w-5 cursor-pointer transition-all duration-200" />
            </div>
          </CopyToClipboard>

          <Badge variant="outline" className="flex h-10 items-center gap-2 px-3 py-1 pr-2 text-sm">
            on {getChainName(order.srcChain)}
            <img
              src={ALL_CHAINS[order.srcChain].logoUrl}
              alt={getChainName(order.srcChain)}
              className={cn("h-6 rounded-full", order.srcChain === b3.id && "h-5 rounded-none")}
            />
          </Badge>
        </div>
        <span className={"text-as-primary/50 mb-1 mt-2"}> to the address:</span>
      </div>
      <CopyToClipboard
        text={order.globalAddress}
        onCopy={() => {
          toast.success("Copied to clipboard");
        }}
      >
        <div className="payment-address bg-b3-react-background border-b3-react-border hover:border-as-brand group flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 px-4 shadow-md transition-all duration-200">
          <div className="text-as-primary overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            {order.globalAddress}
          </div>
          <Copy className="group-hover:text-as-brand text-as-primary/50 h-5 w-5 cursor-pointer transition-all duration-200" />
        </div>
      </CopyToClipboard>

      <div className="payment-buttons mt-4 flex w-full flex-col items-center gap-2">
        <ShinyButton
          accentColor={"hsl(var(--as-brand))"}
          textColor="text-white"
          className="flex w-5/6 max-w-[400px] items-center gap-2 sm:px-0"
          disabled={txLoading || isSwitchingOrExecuting}
          onClick={onPayment}
        >
          {txLoading ? (
            <>
              Transaction Pending
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            </>
          ) : (
            <>
              <span className="whitespace-nowrap pl-4 text-lg md:text-sm">
                {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
                  ? "Pay from Phantom Wallet"
                  : "Pay from Connected Wallet"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </ShinyButton>

        <div>Or</div>

        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex w-full items-center justify-evenly gap-4"
        >
          <div className="qr-code flex flex-col items-center rounded-lg pb-3">
            <QRCodeSVG
              value={getPaymentUrl(
                order.globalAddress,
                BigInt(depositDeficit),
                order.srcTokenAddress === RELAY_ETH_ADDRESS ? srcToken?.symbol || "ETH" : order.srcTokenAddress,
                order.srcChain,
                srcToken?.decimals,
              )}
              className="max-w-[200px]"
            />
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <span className="label-style text-as-brand/70 text-sm">Scan with</span>
              <TextLoop interval={3}>
                <WalletMetamask className="h-5 w-5" variant="branded" />
                <WalletCoinbase className="h-5 w-5" variant="branded" />
                <WalletPhantom className="h-5 w-5" variant="branded" />
                <WalletTrust className="h-5 w-5" variant="branded" />
              </TextLoop>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
