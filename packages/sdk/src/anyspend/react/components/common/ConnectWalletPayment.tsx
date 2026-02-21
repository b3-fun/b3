"use client";

import { RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ShinyButton, useAccountWallet, useProfile } from "@b3dotfun/sdk/global-account/react";
import centerTruncate from "@b3dotfun/sdk/shared/utils/centerTruncate";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import { useAnySpendCustomization } from "../context/AnySpendCustomizationContext";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { OrderDetailsCollapsible } from "./OrderDetailsCollapsible";
import { PaymentMethodSwitch } from "./PaymentMethodSwitch";

type Tournament = components["schemas"]["Tournament"];
type NFT = components["schemas"]["NFT"];

interface ConnectWalletPaymentProps {
  order: components["schemas"]["Order"];
  onPayment: () => void;
  onCancel: () => void;
  txLoading: boolean;
  isSwitchingOrExecuting: boolean;
  phantomWalletAddress?: string | null;
  tournament?: Tournament;
  nft?: NFT;
  cryptoPaymentMethod: CryptoPaymentMethodType;
  onPaymentMethodChange?: (method: CryptoPaymentMethodType) => void;
}

export default function ConnectWalletPayment({
  order,
  onPayment,
  txLoading,
  isSwitchingOrExecuting,
  phantomWalletAddress,
  tournament,
  nft,
  cryptoPaymentMethod,
  onPaymentMethodChange,
}: ConnectWalletPaymentProps) {
  const profile = useProfile({ address: order.recipientAddress });
  const recipientName = profile.data?.name?.replace(/\.b3\.fun/g, "");
  const { connectedEOAWallet, connectedSmartWallet } = useAccountWallet();
  const connectedEvmAddress =
    cryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET
      ? connectedSmartWallet?.getAccount()?.address
      : connectedEOAWallet?.getAccount()?.address;

  const { slots } = useAnySpendCustomization();

  const srcToken = order.metadata.srcToken;
  const dstToken = order.metadata.dstToken;

  const expectedDstAmount =
    order.type === "mint_nft" ||
    order.type === "join_tournament" ||
    order.type === "fund_tournament" ||
    order.type === "custom"
      ? "0"
      : order.payload.expectedDstAmount.toString();
  const formattedExpectedDstAmount = formatTokenAmount(BigInt(expectedDstAmount), dstToken.decimals);

  if (!srcToken || !dstToken) {
    return <div>Loading...</div>;
  }

  const paymentLabel =
    order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
      ? "Pay from Phantom Wallet"
      : cryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET
        ? "Pay from Global Account"
        : "Pay from Connected Wallet";

  const connectedAddress =
    order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
      ? phantomWalletAddress
      : connectedEvmAddress;

  if (slots.connectWalletButton) {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        {slots.connectWalletButton({
          onPayment,
          txLoading,
          connectedAddress: connectedAddress || undefined,
          paymentLabel,
        })}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Payment Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex w-full flex-col items-center gap-2"
      >
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
                {paymentLabel}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </ShinyButton>
        <span className="label-style text-as-primary/50 text-xs">
          Connected to:{" "}
          {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
            ? centerTruncate(phantomWalletAddress, 6)
            : centerTruncate(connectedEvmAddress || "")}
        </span>

        <PaymentMethodSwitch currentMethod={cryptoPaymentMethod} onMethodChange={onPaymentMethodChange} />

        <div className="mt-4">
          <OrderDetailsCollapsible
            order={order}
            dstToken={dstToken}
            tournament={tournament}
            nft={nft}
            recipientName={recipientName}
            formattedExpectedDstAmount={formattedExpectedDstAmount}
          />
        </div>
      </motion.div>
    </div>
  );
}
