"use client";

import { USDC_BASE } from "@b3dotfun/sdk/anyspend";
import {
  useAnyspendQuote,
  useGeoOnrampOptions,
} from "@b3dotfun/sdk/anyspend/react";
import {
  Button,
  ShinyButton,
  TabsPrimitive,
  useAccountWallet,
  useB3,
  useModalStore,
  useProfile,
} from "@b3dotfun/sdk/global-account/react";
import BottomNavigation from "@b3dotfun/sdk/global-account/react/components/ManageAccount/BottomNavigation";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { ArrowDown, HistoryIcon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { defineChain } from "thirdweb";
import { parseUnits } from "viem";
import { base } from "viem/chains";
import { components } from "../../types/api";
import { CryptoPaymentMethodType } from "./common/CryptoPaymentMethod";
import { CryptoPaySection } from "./common/CryptoPaySection";
import { CryptoReceiveSection } from "./common/CryptoReceiveSection";
import { FiatPaymentMethod } from "./common/FiatPaymentMethod";
import { PanelOnramp } from "./common/PanelOnramp";
import { TabSection } from "./common/TabSection";
import { useAnyspendSwapStore } from "../stores/useAnyspendSwapStore";
import { useAnyspendUIStore, PanelView } from "../stores/useAnyspendUIStore";
import { useAnyspendPaymentStore } from "../stores/useAnyspendPaymentStore";
import { useAnyspendRecipientStore } from "../stores/useAnyspendRecipientStore";

interface AnyspendMainViewProps {
  mode?: "page" | "modal";
  isBuyMode: boolean;
  destinationTokenAddress?: string;
  destinationTokenChainId?: number;
  hideTransactionHistoryButton?: boolean;
  onTokenSelect?: (token: components["schemas"]["Token"], event: { preventDefault: () => void }) => void;
  customUsdInputValues?: string[];
  btnInfo: { text: string; disable: boolean; error: boolean; loading: boolean };
  onMainButtonClick: () => void;
  onClickHistory: () => void;
  anyspendQuote: any;
  isLoadingAnyspendQuote: boolean;
}

export function AnyspendMainView({
  mode = "modal",
  isBuyMode,
  destinationTokenAddress,
  destinationTokenChainId,
  hideTransactionHistoryButton,
  onTokenSelect,
  customUsdInputValues,
  btnInfo,
  onMainButtonClick,
  onClickHistory,
  anyspendQuote,
}: AnyspendMainViewProps) {
  const { partnerId } = useB3();
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  // Get state from stores - using single selectors per repo rules
  const activeTab = useAnyspendUIStore(state => state.activeTab);
  const setActiveTab = useAnyspendUIStore(state => state.setActiveTab);
  const navigateToPanel = useAnyspendUIStore(state => state.navigateToPanel);
  const setActivePanel = useAnyspendUIStore(state => state.setActivePanel);
  
  const selectedSrcChainId = useAnyspendSwapStore(state => state.selectedSrcChainId);
  const setSelectedSrcChainId = useAnyspendSwapStore(state => state.setSelectedSrcChainId);
  const selectedSrcToken = useAnyspendSwapStore(state => state.selectedSrcToken);
  const setSelectedSrcToken = useAnyspendSwapStore(state => state.setSelectedSrcToken);
  const srcAmount = useAnyspendSwapStore(state => state.srcAmount);
  const setSrcAmount = useAnyspendSwapStore(state => state.setSrcAmount);
  const srcAmountOnRamp = useAnyspendSwapStore(state => state.srcAmountOnRamp);
  const setSrcAmountOnRamp = useAnyspendSwapStore(state => state.setSrcAmountOnRamp);
  
  const selectedDstChainId = useAnyspendSwapStore(state => state.selectedDstChainId);
  const setSelectedDstChainId = useAnyspendSwapStore(state => state.setSelectedDstChainId);
  const selectedDstToken = useAnyspendSwapStore(state => state.selectedDstToken);
  const setSelectedDstToken = useAnyspendSwapStore(state => state.setSelectedDstToken);
  const dstAmount = useAnyspendSwapStore(state => state.dstAmount);
  const setDstAmount = useAnyspendSwapStore(state => state.setDstAmount);
  const isSrcInputDirty = useAnyspendSwapStore(state => state.isSrcInputDirty);
  const setIsSrcInputDirty = useAnyspendSwapStore(state => state.setIsSrcInputDirty);
  
  const selectedCryptoPaymentMethod = useAnyspendPaymentStore(state => state.selectedCryptoPaymentMethod);
  const setSelectedCryptoPaymentMethod = useAnyspendPaymentStore(state => state.setSelectedCryptoPaymentMethod);
  const selectedFiatPaymentMethod = useAnyspendPaymentStore(state => state.selectedFiatPaymentMethod);
  const setSelectedFiatPaymentMethod = useAnyspendPaymentStore(state => state.setSelectedFiatPaymentMethod);
  
  const recipientAddress = useAnyspendRecipientStore(state => state.recipientAddress);

  const { address: globalAddress, wallet: globalWallet } = useAccountWallet();
  const recipientProfile = useProfile({ address: recipientAddress, fresh: true });
  const recipientName = recipientProfile.data?.name;

  // Define base chain with RPC for modal props
  const baseChain = useMemo(
    () =>
      defineChain({
        id: 8453,
        name: "Base",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpc: "https://mainnet.base.org",
        blockExplorers: [
          {
            name: "Basescan",
            url: "https://basescan.org",
          },
        ],
      }),
    [],
  );

  return (
    <div className={"mx-auto flex w-[460px] max-w-full flex-col items-center gap-2"}>
      <div className={"mx-auto flex max-w-full flex-col items-center gap-2 px-5"}>
        {/* Token Header - Show when in buy mode */}
        {isBuyMode && (
          <div className="mb-4 flex flex-col items-center gap-3 text-center">
            {selectedDstToken.metadata?.logoURI && (
              <div className="relative">
                <img
                  src={selectedDstToken.metadata.logoURI}
                  alt={selectedDstToken.symbol}
                  className="border-as-stroke h-12 w-12 rounded-full border-2 shadow-md"
                />
              </div>
            )}
            <div>
              <h1 className="text-as-primary text-xl font-bold">Buy {selectedDstToken.symbol}</h1>
            </div>
          </div>
        )}

        {/* Tab section */}
        <TabSection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedCryptoPaymentMethod={setSelectedCryptoPaymentMethod}
          setSelectedFiatPaymentMethod={setSelectedFiatPaymentMethod}
        />

        <div className="relative flex w-full max-w-[calc(100vw-32px)] flex-col gap-2">
          {/* Send section */}
          {activeTab === "crypto" ? (
            <CryptoPaySection
              selectedSrcChainId={selectedSrcChainId}
              setSelectedSrcChainId={setSelectedSrcChainId}
              selectedSrcToken={selectedSrcToken}
              setSelectedSrcToken={setSelectedSrcToken}
              srcAmount={srcAmount}
              setSrcAmount={setSrcAmount}
              isSrcInputDirty={isSrcInputDirty}
              setIsSrcInputDirty={setIsSrcInputDirty}
              selectedCryptoPaymentMethod={selectedCryptoPaymentMethod}
              onSelectCryptoPaymentMethod={() => navigateToPanel(PanelView.CRYPTO_PAYMENT_METHOD, "forward")}
              anyspendQuote={anyspendQuote}
              onTokenSelect={onTokenSelect}
              onShowFeeDetail={() => navigateToPanel(PanelView.FEE_DETAIL, "forward")}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
            >
              <PanelOnramp
                srcAmountOnRamp={srcAmountOnRamp}
                setSrcAmountOnRamp={setSrcAmountOnRamp}
                selectedPaymentMethod={selectedFiatPaymentMethod}
                setActivePanel={(panelIndex: number) => {
                  // Map panel index to navigation with direction
                  const panelsWithForwardNav = [PanelView.FIAT_PAYMENT_METHOD, PanelView.RECIPIENT_SELECTION];
                  if (panelsWithForwardNav.includes(panelIndex)) {
                    navigateToPanel(panelIndex, "forward");
                  } else {
                    setActivePanel(panelIndex);
                  }
                }}
                _recipientAddress={recipientAddress}
                destinationToken={selectedDstToken}
                destinationChainId={selectedDstChainId}
                destinationAmount={dstAmount}
                onDestinationTokenChange={setSelectedDstToken}
                onDestinationChainChange={setSelectedDstChainId}
                fiatPaymentMethodIndex={PanelView.FIAT_PAYMENT_METHOD}
                recipientSelectionPanelIndex={PanelView.RECIPIENT_SELECTION}
                hideDstToken={isBuyMode}
                anyspendQuote={anyspendQuote}
                onShowPointsDetail={() => navigateToPanel(PanelView.POINTS_DETAIL, "forward")}
                onShowFeeDetail={() => navigateToPanel(PanelView.FEE_DETAIL, "forward")}
                customUsdInputValues={customUsdInputValues}
              />
            </motion.div>
          )}

          {/* Reverse swap direction section */}
          <Button
            variant="ghost"
            className={cn(
              "border-as-stroke bg-as-surface-primary absolute left-1/2 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 sm:h-8 sm:w-8 sm:rounded-xl",
              isBuyMode && "top-[calc(50%+56px)] cursor-default",
              activeTab === "fiat" && "hidden",
            )}
            onClick={() => {
              if (activeTab === "fiat" || isBuyMode) {
                return;
              }

              // Swap chain selections
              const tempSrcChainId = selectedSrcChainId;
              const tempDstChainId = selectedDstChainId;
              setSelectedSrcChainId(tempDstChainId);
              setSelectedDstChainId(tempSrcChainId);

              // Swap token selections
              const tempSrcToken = selectedSrcToken;
              const tempDstToken = selectedDstToken;
              setSelectedSrcToken(tempDstToken);
              setSelectedDstToken(tempSrcToken);

              // Swap amounts
              const tempSrcAmount = srcAmount;
              const tempDstAmount = dstAmount;
              setSrcAmount(tempDstAmount);
              setDstAmount(tempSrcAmount);
            }}
          >
            <div className="relative flex items-center justify-center transition-opacity">
              <ArrowDown className="text-as-primary/50 h-5 w-5" />
            </div>
          </Button>

          {/* Receive section - Hidden when fiat tab is active */}
          {activeTab === "crypto" && (
            <CryptoReceiveSection
              isDepositMode={false}
              isBuyMode={isBuyMode}
              selectedRecipientAddress={recipientAddress}
              recipientName={recipientName || undefined}
              onSelectRecipient={() => navigateToPanel(PanelView.RECIPIENT_SELECTION, "forward")}
              dstAmount={dstAmount}
              dstToken={selectedDstToken}
              selectedDstChainId={selectedDstChainId}
              setSelectedDstChainId={setSelectedDstChainId}
              setSelectedDstToken={setSelectedDstToken}
              isSrcInputDirty={isSrcInputDirty}
              onChangeDstAmount={value => {
                setIsSrcInputDirty(false);
                setDstAmount(value);
              }}
              anyspendQuote={anyspendQuote}
              onShowPointsDetail={() => navigateToPanel(PanelView.POINTS_DETAIL, "forward")}
              onShowFeeDetail={() => navigateToPanel(PanelView.FEE_DETAIL, "forward")}
            />
          )}
        </div>

        {/* Main button section */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className={cn("mt-4 flex w-full max-w-[460px] flex-col gap-2")}
        >
          <ShinyButton
            accentColor={"hsl(var(--as-brand))"}
            disabled={btnInfo.disable}
            onClick={onMainButtonClick}
            className={cn(
              "as-main-button relative w-full",
              btnInfo.error ? "!bg-as-red" : btnInfo.disable ? "!bg-as-on-surface-2" : "!bg-as-brand",
            )}
            textClassName={cn(btnInfo.error ? "text-white" : btnInfo.disable ? "text-as-secondary" : "text-white")}
          >
            <div className="flex items-center justify-center gap-2">
              {btnInfo.loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {btnInfo.text}
            </div>
          </ShinyButton>

          {!hideTransactionHistoryButton && (globalAddress || recipientAddress) ? (
            <Button
              variant="link"
              onClick={onClickHistory}
              className="text-as-primary/50 hover:text-as-primary flex items-center gap-1 transition-colors"
            >
              <HistoryIcon className="h-4 w-4" /> <span className="pr-4">Transaction History</span>
            </Button>
          ) : null}
        </motion.div>
      </div>
      <div className="w-full">
        <TabsPrimitive
          defaultValue="swap"
          onValueChange={value => {
            if (value === "settings" || value === "home") {
              setB3ModalContentType({
                type: "manageAccount",
                activeTab: value,
                setActiveTab: () => {},
                chain: baseChain,
                partnerId,
              });
            } else if (value === "swap") {
              setB3ModalContentType({
                type: "anySpend",
                showBackButton: true,
              });
            }
          }}
        >
          <BottomNavigation />
        </TabsPrimitive>
      </div>
    </div>
  );
}

