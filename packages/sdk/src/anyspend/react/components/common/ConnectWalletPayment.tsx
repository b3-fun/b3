"use client";

import { RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ShinyButton, useProfile } from "@b3dotfun/sdk/global-account/react";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import { OrderDetailsCollapsible } from "./OrderDetailsCollapsible";

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
}

export default function ConnectWalletPayment({
  order,
  onPayment,
  txLoading,
  isSwitchingOrExecuting,
  phantomWalletAddress,
  tournament,
  nft,
}: ConnectWalletPaymentProps) {
  const profile = useProfile({ address: order.recipientAddress });
  const recipientName = profile.data?.name?.replace(/\.b3\.fun/g, "");

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
                {order.srcChain === RELAY_SOLANA_MAINNET_CHAIN_ID && phantomWalletAddress
                  ? "Pay from Phantom Wallet"
                  : "Pay from Connected Wallet"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </ShinyButton>

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
