import { Input, useProfile, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { formatDisplayNumber } from "@b3dotfun/sdk/shared/utils/number";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { components } from "../../../types/api";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";
import { FiatPaymentMethod } from "./FiatPaymentMethod";
import { OrderTokenAmount } from "./OrderTokenAmount";
import { TokenBalance } from "./TokenBalance";

interface PaySectionProps {
  paymentType: "crypto" | "fiat";
  // Token state
  selectedSrcChainId: number;
  setSelectedSrcChainId: (chainId: number) => void;
  selectedSrcToken: components["schemas"]["Token"];
  setSelectedSrcToken: (token: components["schemas"]["Token"]) => void;
  srcAmount: string;
  setSrcAmount: (amount: string) => void;
  setIsSrcInputDirty: (dirty: boolean) => void;
  // Payment method state
  selectedCryptoPaymentMethod: CryptoPaymentMethodType;
  selectedFiatPaymentMethod: FiatPaymentMethod;
  onSelectCryptoPaymentMethod: () => void;
  onSelectFiatPaymentMethod: () => void;
  // Quote data
  anyspendQuote?: any;
}

export function PaySection({
  paymentType,
  selectedSrcChainId,
  setSelectedSrcChainId,
  selectedSrcToken,
  setSelectedSrcToken,
  srcAmount,
  setSrcAmount,
  setIsSrcInputDirty,
  selectedCryptoPaymentMethod,
  selectedFiatPaymentMethod,
  onSelectCryptoPaymentMethod,
  onSelectFiatPaymentMethod,
  anyspendQuote,
}: PaySectionProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: profileData } = useProfile({ address: connectedAddress });
  const connectedName = profileData?.displayName;
  const { data: srcTokenMetadata } = useTokenData(selectedSrcToken?.chainId, selectedSrcToken?.address);

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
        <div className="text-as-primary/50 flex h-7 items-center text-sm">Pay</div>
        {paymentType === "crypto" ? (
          <button
            className="text-as-tertiarry flex h-7 items-center gap-2 text-sm transition-colors focus:!outline-none"
            onClick={onSelectCryptoPaymentMethod}
          >
            {selectedCryptoPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET ? (
              <>
                {isConnected ? (
                  <div className="flex items-center gap-1">
                    {connectedName ? formatUsername(connectedName) : shortenAddress(connectedAddress || "")}
                  </div>
                ) : (
                  "Connect wallet"
                )}
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
        ) : (
          <button
            className="text-as-tertiarry flex h-7 items-center gap-2 text-sm transition-colors"
            onClick={onSelectFiatPaymentMethod}
          >
            {selectedFiatPaymentMethod === FiatPaymentMethod.COINBASE_PAY ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-xs font-bold text-white">C</span>
                  </div>
                  Coinbase Pay
                </div>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : selectedFiatPaymentMethod === FiatPaymentMethod.STRIPE ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-xs font-bold text-white">S</span>
                  </div>
                  Credit/Debit Card
                </div>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Select payment method
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
      {paymentType === "crypto" ? (
        <>
          <OrderTokenAmount
            address={connectedAddress}
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
              walletAddress={connectedAddress}
              onChangeInput={value => {
                setIsSrcInputDirty(true);
                setSrcAmount(value);
              }}
            />
          </div>
        </>
      ) : (
        <>
          {/* Fiat amount input - styled like PanelOnramp */}
          <div className="flex items-center justify-center pb-2 pt-8">
            <div className="flex gap-1">
              <span className="text-as-tertiarry text-2xl font-bold">$</span>
              <Input
                type="text"
                value={srcAmount}
                onChange={e => setSrcAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="5"
                className="text-as-primary placeholder:text-as-primary/50 h-auto min-w-[70px] border-0 bg-transparent p-0 px-3 pt-1 text-4xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  width: `${Math.max(50, srcAmount.length * 34)}px`,
                }}
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="mx-auto mb-6 inline-grid grid-cols-4 gap-2">
            {["5", "10", "20", "25"].map(value => (
              <button
                key={value}
                onClick={() => setSrcAmount(value)}
                className={`bg-as-surface-secondary border-as-border-secondary hover:border-as-border-secondary h-7 w-14 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  srcAmount === value
                    ? "border-as-border-secondary bg-as-surface-secondary"
                    : "bg-as-surface-secondary hover:bg-as-surface-secondary"
                }`}
              >
                ${value}
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
