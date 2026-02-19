"use client";

import { ALL_CHAINS, ZERO_ADDRESS } from "@b3dotfun/sdk/anyspend";
import { getPaymentUrl } from "@b3dotfun/sdk/anyspend/utils/chain";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendOrderAndTransactions";
import { useCreateDepositFirstOrder } from "@b3dotfun/sdk/anyspend/react/hooks/useCreateDepositFirstOrder";
import { useOnOrderSuccess } from "@b3dotfun/sdk/anyspend/react/hooks/useOnOrderSuccess";
import { useAnyspendTokenList } from "@b3dotfun/sdk/anyspend/react/hooks/useAnyspendTokens";
import { isNativeToken } from "@b3dotfun/sdk/anyspend/utils/token";
import { EVM_MAINNET } from "@b3dotfun/sdk/anyspend/utils/chain";
import {
  useAccountWallet,
  useB3Config,
  useModalStore,
  useIsMobile,
} from "@b3dotfun/sdk/global-account/react";
import { thirdwebB3Chain } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@b3dotfun/sdk/global-account/react/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@b3dotfun/sdk/global-account/react/components/ui/drawer";
import { Check, ChevronDown, Copy, Loader2, Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChainTokenIcon } from "../common/ChainTokenIcon";
import type { AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface QRCheckoutPanelProps {
  recipientAddress: string;
  destinationTokenAddress: string;
  destinationTokenChainId: number;
  totalAmount: string;
  themeColor?: string;
  onSuccess?: (result: { txHash?: string; orderId?: string }) => void;
  onError?: (error: Error) => void;
  callbackMetadata?: Record<string, unknown>;
  classes?: AnySpendCheckoutClasses;
}

// Default source token: ETH on Base
const DEFAULT_ETH_ON_BASE: components["schemas"]["Token"] = {
  chainId: 8453,
  address: ZERO_ADDRESS,
  symbol: "ETH",
  name: "Ethereum",
  decimals: 18,
  metadata: { logoURI: "https://assets.relay.link/icons/1/light.png" },
};

const SOURCE_CHAINS = Object.values(EVM_MAINNET).map(c => ({ id: c.id, name: c.name, logoUrl: c.logoUrl }));

export function QRCheckoutPanel({
  recipientAddress,
  destinationTokenAddress,
  destinationTokenChainId,
  totalAmount: _totalAmount,
  themeColor,
  onSuccess,
  onError,
  callbackMetadata: _callbackMetadata,
  classes,
}: QRCheckoutPanelProps) {
  const [selectedSrcChainId, setSelectedSrcChainId] = useState(8453); // Base
  const [selectedSrcToken, setSelectedSrcToken] = useState<components["schemas"]["Token"]>(DEFAULT_ETH_ON_BASE);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const { address: walletAddress } = useAccountWallet();
  const { partnerId } = useB3Config();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  // Order state
  const [orderId, setOrderId] = useState<string | undefined>();
  const [globalAddress, setGlobalAddress] = useState<string | undefined>();
  const orderCreatedRef = useRef(false);

  // Create deposit_first order
  const { createOrder, isCreatingOrder } = useCreateDepositFirstOrder({
    onSuccess: (data: any) => {
      const id = data?.data?.id;
      const addr = data?.data?.globalAddress;
      setOrderId(id);
      setGlobalAddress(addr);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  // Build destination token object
  const dstToken: components["schemas"]["Token"] = useMemo(
    () => ({
      address: destinationTokenAddress,
      chainId: destinationTokenChainId,
      decimals: 18,
      symbol: "",
      name: "",
      metadata: {},
    }),
    [destinationTokenAddress, destinationTokenChainId],
  );

  // Create order when token is selected and we don't have one yet
  useEffect(() => {
    if (orderCreatedRef.current) return;
    if (!selectedSrcToken) return;

    orderCreatedRef.current = true;
    createOrder({
      recipientAddress,
      srcChain: selectedSrcChainId,
      dstChain: destinationTokenChainId,
      srcToken: selectedSrcToken,
      dstToken,
    });
  }, [recipientAddress, selectedSrcChainId, destinationTokenChainId, selectedSrcToken, dstToken, createOrder]);

  // Poll order status
  const { orderAndTransactions: oat } = useAnyspendOrderAndTransactions(orderId);

  // Call onSuccess when order is executed
  useOnOrderSuccess({
    orderData: oat,
    orderId,
    onSuccess: (txHash?: string) => {
      onSuccess?.({ orderId, txHash });
    },
  });

  const displayAddress = globalAddress || "";

  // Generate QR code value
  const qrValue = displayAddress
    ? getPaymentUrl(
        displayAddress,
        undefined,
        isNativeToken(selectedSrcToken.address) ? "ETH" : selectedSrcToken.address,
        selectedSrcChainId,
        selectedSrcToken.decimals,
      )
    : "";

  const handleCopyAddress = async () => {
    if (displayAddress) {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectToken = (token: components["schemas"]["Token"]) => {
    setSelectedSrcToken(token);
    setSelectedSrcChainId(token.chainId);
    setShowTokenSelector(false);
    setTokenSearchQuery("");
    // Reset order so a new one is created with the new token
    setOrderId(undefined);
    setGlobalAddress(undefined);
    orderCreatedRef.current = false;
  };

  const isWaiting = !!orderId && oat?.data?.order?.status !== "executed";

  return (
    <div className={cn("anyspend-qr-checkout-panel flex flex-col gap-4", classes?.cryptoPanel)}>
      {/* Token Selector */}
      <div className="anyspend-token-selector">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Deposit token
        </label>
        <button
          onClick={() => setShowTokenSelector(true)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
            classes?.tokenSelector,
          )}
        >
          <div className="flex items-center gap-3">
            <ChainTokenIcon
              chainUrl={ALL_CHAINS[selectedSrcToken.chainId]?.logoUrl || ""}
              tokenUrl={selectedSrcToken.metadata?.logoURI}
              className="h-8 w-8"
            />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedSrcToken.symbol}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ALL_CHAINS[selectedSrcChainId]?.name || ""}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Token Selector Modal */}
      <QRTokenSelectorModal
        open={showTokenSelector}
        onClose={() => {
          setShowTokenSelector(false);
          setTokenSearchQuery("");
        }}
        tokenSearchQuery={tokenSearchQuery}
        onSearchChange={setTokenSearchQuery}
        onSelectToken={handleSelectToken}
        selectedToken={selectedSrcToken}
        chainId={selectedSrcChainId}
        onChainChange={chainId => {
          setSelectedSrcChainId(chainId);
          setTokenSearchQuery("");
        }}
      />

      {/* QR Code Display */}
      {isCreatingOrder && !globalAddress ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Creating deposit address...</p>
        </div>
      ) : displayAddress ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          {/* QR Code */}
          <div className="rounded-lg bg-white p-3">
            <QRCodeSVG value={qrValue} size={140} level="M" marginSize={0} />
          </div>

          {/* Address */}
          <div className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Deposit address:</span>
            <div className="flex items-start gap-2">
              <span className="min-w-0 break-all font-mono text-xs leading-relaxed text-gray-900 dark:text-gray-100">
                {displayAddress}
              </span>
              <button
                onClick={handleCopyAddress}
                className="mt-0.5 shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Warning */}
          <p className="text-center text-xs text-amber-600 dark:text-amber-400">
            Only send {selectedSrcToken.symbol} on {ALL_CHAINS[selectedSrcChainId]?.name || "the specified chain"}.
            Other tokens will not be converted.
          </p>

          {/* Watching indicator */}
          {isWaiting && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-600 dark:text-blue-400">Watching for deposit...</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Copy / Connect Wallet Button */}
      {!walletAddress ? (
        <button
          onClick={() => {
            setB3ModalContentType({ type: "signInWithB3", showBackButton: false, chain: thirdwebB3Chain, partnerId });
            setB3ModalOpen(true);
          }}
          className={cn(
            "w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all",
            "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
            classes?.payButton,
          )}
          style={themeColor ? { backgroundColor: themeColor } : undefined}
        >
          Connect Wallet
        </button>
      ) : displayAddress ? (
        <button
          onClick={handleCopyAddress}
          className={cn(
            "w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all",
            "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
            classes?.payButton,
          )}
          style={themeColor ? { backgroundColor: themeColor } : undefined}
        >
          {copied ? "Copied!" : "Copy deposit address"}
        </button>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------------
// QR Token Selector Modal (simplified — no balance fetching)
// -------------------------------------------------------------------

interface QRTokenSelectorModalProps {
  open: boolean;
  onClose: () => void;
  tokenSearchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectToken: (token: components["schemas"]["Token"]) => void;
  selectedToken: components["schemas"]["Token"] | null;
  chainId: number;
  onChainChange: (chainId: number) => void;
}

function QRTokenSelectorModal({
  open,
  onClose,
  tokenSearchQuery,
  onSearchChange,
  onSelectToken,
  selectedToken,
  chainId,
  onChainChange,
}: QRTokenSelectorModalProps) {
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: tokenList, isLoading: isLoadingTokens } = useAnyspendTokenList(chainId, tokenSearchQuery);

  const prevListRef = useRef<components["schemas"]["Token"][] | undefined>(undefined);
  if (tokenList && tokenList.length > 0) {
    prevListRef.current = tokenList;
  }
  const displayList =
    tokenList && tokenList.length > 0
      ? tokenList
      : isLoadingTokens
        ? prevListRef.current
        : tokenList;

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const ModalComponent = isMobile ? Drawer : Dialog;
  const ModalContent = isMobile ? DrawerContent : DialogContent;
  const ModalTitle = isMobile ? DrawerTitle : DialogTitle;
  const ModalDescription = isMobile ? DrawerDescription : DialogDescription;

  return (
    <ModalComponent
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) onClose();
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `.anyspend-qr-token-modal .b3-modal-ga-branding { display: none; } .anyspend-qr-token-modal .modal-inner-content { margin-bottom: 0; }`,
        }}
      />
      <ModalContent className="anyspend-qr-token-modal flex max-h-[80dvh] flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-xl sm:max-h-[70dvh] dark:bg-gray-900">
        <ModalTitle className="sr-only">Select token</ModalTitle>
        <ModalDescription className="sr-only">Choose a token to deposit via QR</ModalDescription>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Select token</h3>
          </div>

          {/* Chain Selector */}
          <div className="flex items-center gap-2 px-5 pb-3">
            {SOURCE_CHAINS.map(chain => (
              <button
                key={chain.id}
                onClick={() => onChainChange(chain.id)}
                title={chain.name}
                className="relative shrink-0 rounded-full transition-opacity"
                style={{ opacity: chain.id === chainId ? 1 : 0.4 }}
              >
                <img src={chain.logoUrl} alt={chain.name} className="h-7 w-7 rounded-full" />
                {chain.id === chainId && (
                  <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 2px #3b82f6" }} />
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-2.5 dark:border-gray-800">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={tokenSearchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search tokens..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-gray-100"
            />
          </div>

          {/* Token List */}
          <div className="relative flex-1 overflow-y-auto" style={{ minHeight: 300 }}>
            {displayList?.map((token: components["schemas"]["Token"]) => {
              const isSelected =
                selectedToken &&
                selectedToken.address.toLowerCase() === token.address.toLowerCase() &&
                selectedToken.chainId === token.chainId;

              return (
                <button
                  key={`${token.chainId}-${token.address}`}
                  onClick={() => onSelectToken(token)}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20",
                  )}
                >
                  <ChainTokenIcon
                    chainUrl={ALL_CHAINS[token.chainId]?.logoUrl || ""}
                    tokenUrl={token.metadata?.logoURI}
                    className="h-8 w-8"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{token.symbol}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{token.name}</p>
                  </div>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                </button>
              );
            })}
            {!isLoadingTokens && displayList && displayList.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No tokens found</div>
            )}
          </div>
        </div>
      </ModalContent>
    </ModalComponent>
  );
}
