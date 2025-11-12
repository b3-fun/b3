import { useProfile, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { formatDisplayNumber } from "@b3dotfun/sdk/shared/utils/number";
import { ChevronRight, Info } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { components } from "../../../types/api";
import { useConnectedWalletDisplay } from "../../hooks/useConnectedWalletDisplay";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { OrderTokenAmount } from "./OrderTokenAmount";
import { TokenBalance } from "./TokenBalance";

interface CryptoPaySectionProps {
  // Token state
  selectedSrcChainId: number;
  setSelectedSrcChainId: (chainId: number) => void;
  selectedSrcToken: components["schemas"]["Token"];
  setSelectedSrcToken: (token: components["schemas"]["Token"]) => void;
  srcAmount: string;
  setSrcAmount: (amount: string) => void;
  isSrcInputDirty: boolean;
  setIsSrcInputDirty: (dirty: boolean) => void;
  // Payment method state
  selectedCryptoPaymentMethod: CryptoPaymentMethodType;
  onSelectCryptoPaymentMethod: () => void;
  // Quote data
  anyspendQuote?: any;
  // Token selection callback
  onTokenSelect?: (token: components["schemas"]["Token"], event: { preventDefault: () => void }) => void;
  // Fee detail callback
  onShowFeeDetail?: () => void;
}

export function CryptoPaySection({
  selectedSrcChainId,
  setSelectedSrcChainId,
  selectedSrcToken,
  setSelectedSrcToken,
  srcAmount,
  setSrcAmount,
  isSrcInputDirty,
  setIsSrcInputDirty,
  selectedCryptoPaymentMethod,
  onSelectCryptoPaymentMethod,
  anyspendQuote,
  onTokenSelect,
  onShowFeeDetail,
}: CryptoPaySectionProps) {
  const { data: srcTokenMetadata } = useTokenData(selectedSrcToken?.chainId, selectedSrcToken?.address);

  // Use custom hook to determine wallet address based on payment method
  const { walletAddress } = useConnectedWalletDisplay(selectedCryptoPaymentMethod);

  const { data: profileData } = useProfile({ address: walletAddress });
  const connectedName = profileData?.displayName;

  // Add ref to track if we've applied metadata
  const appliedSrcMetadataRef = useRef(false);

  // Update source token with metadata
  useEffect(() => {
    if (selectedSrcToken && srcTokenMetadata && !appliedSrcMetadataRef.current) {
      // Mark as applied
      appliedSrcMetadataRef.current = true;

      const enhancedToken = {
        ...selectedSrcToken,
        decimals: srcTokenMetadata.decimals || selectedSrcToken.decimals,
        symbol: srcTokenMetadata.symbol || selectedSrcToken.symbol,
        name: srcTokenMetadata.name || selectedSrcToken.name,
        metadata: {
          ...selectedSrcToken.metadata,
          logoURI: srcTokenMetadata?.logoURI || selectedSrcToken.metadata.logoURI,
        },
      };
      setSelectedSrcToken(enhancedToken);
    }
  }, [srcTokenMetadata, selectedSrcToken, setSelectedSrcToken]);

  // Reset source token ref when address/chain changes
  useEffect(() => {
    appliedSrcMetadataRef.current = false;
  }, [selectedSrcToken.address, selectedSrcToken.chainId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
      className="pay-section bg-as-surface-secondary border-as-border-secondary relative flex w-full flex-col gap-2 rounded-2xl border p-4 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div className="text-as-primary/50 flex h-7 items-center gap-1.5 text-sm">
          Pay
          {!isSrcInputDirty && anyspendQuote?.data?.fee && onShowFeeDetail && (
            <button onClick={onShowFeeDetail} className="text-as-primary/40 hover:text-as-primary/60 transition-colors">
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          className="text-as-tertiarry flex h-7 items-center gap-2 text-sm transition-colors focus:!outline-none"
          onClick={onSelectCryptoPaymentMethod}
        >
          {selectedCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ? (
            <>
              {walletAddress ? (
                <div className="flex items-center gap-1">
                  {connectedName ? formatUsername(connectedName) : shortenAddress(walletAddress || "")}
                </div>
              ) : (
                "Connect wallet"
              )}
              <ChevronRight className="h-4 w-4" />
            </>
          ) : selectedCryptoPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET ? (
            <>
              Global Account
              <ChevronRight className="h-4 w-4" />
            </>
          ) : selectedCryptoPaymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO ? (
            <>
              Transfer crypto
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Select payment method
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      <OrderTokenAmount
        address={walletAddress}
        walletAddress={walletAddress}
        context="from"
        inputValue={srcAmount}
        onChangeInput={value => {
          setIsSrcInputDirty(true);
          setSrcAmount(value);
        }}
        chainId={selectedSrcChainId}
        setChainId={setSelectedSrcChainId}
        token={selectedSrcToken}
        setToken={setSelectedSrcToken}
        onTokenSelect={onTokenSelect}
      />
      <div className="flex items-center justify-between">
        <div className="text-as-primary/50 flex h-5 items-center text-sm">
          {formatDisplayNumber(anyspendQuote?.data?.currencyIn?.amountUsd, {
            style: "currency",
            fallback: "",
          })}
        </div>
        <TokenBalance
          token={selectedSrcToken}
          walletAddress={walletAddress}
          onChangeInput={value => {
            setIsSrcInputDirty(true);
            setSrcAmount(value);
          }}
        />
      </div>
    </motion.div>
  );
}
