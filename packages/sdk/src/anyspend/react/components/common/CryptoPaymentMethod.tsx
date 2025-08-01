"use client";

import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { ChevronLeft, ChevronRightCircle, Wallet, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSetActiveWallet } from "thirdweb/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export enum PaymentMethod {
  NONE = "none",
  CONNECT_WALLET = "connect_wallet",
  TRANSFER_CRYPTO = "transfer_crypto",
}

interface CryptoPaymentMethodProps {
  globalAddress?: string;
  globalWallet?: {
    meta?: {
      icon?: string;
    };
  };
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  isCreatingOrder: boolean;
  onBack: () => void;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
}

export function CryptoPaymentMethod({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  isCreatingOrder,
  onBack,
  onSelectPaymentMethod,
}: CryptoPaymentMethodProps) {
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const wagmiAccount = useAccount();
  const { address: globalAddress, connectedEOAWallet, isActiveEOAWallet, wallet: globalWallet } = useAccountWallet();
  const { disconnect } = useDisconnect();
  const previousAddress = useRef<string | undefined>(globalAddress);

  const setActiveWallet = useSetActiveWallet();

  // Automatically set EOA wallet as active when available
  useEffect(() => {
    if (connectedEOAWallet) {
      console.log("Setting active wallet", connectedEOAWallet);
      setActiveWallet(connectedEOAWallet);
    }
  }, [connectedEOAWallet, isActiveEOAWallet, setActiveWallet]);

  // Handle wallet connection success
  useEffect(() => {
    if (globalAddress && previousAddress.current !== globalAddress) {
      previousAddress.current = globalAddress;
      toast.success("Wallet connected successfully");
      // Automatically select connect wallet method and go back to main view
      setSelectedPaymentMethod(PaymentMethod.CONNECT_WALLET);
      onSelectPaymentMethod(PaymentMethod.CONNECT_WALLET);
    }
  }, [globalAddress, setSelectedPaymentMethod, onSelectPaymentMethod]);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      // Handle specific error cases
      if (connectError.message.includes("Connector already connected")) {
        // If connector is already connected, just proceed with the flow
        console.log("Connector already connected, proceeding with selection");
        // Use wagmi account address or global address
        if (wagmiAccount.address || globalAddress) {
          setSelectedPaymentMethod(PaymentMethod.CONNECT_WALLET);
          onSelectPaymentMethod(PaymentMethod.CONNECT_WALLET);
        } else {
          // Fallback: proceed anyway as the connector reports it's connected
          setTimeout(() => {
            setSelectedPaymentMethod(PaymentMethod.CONNECT_WALLET);
            onSelectPaymentMethod(PaymentMethod.CONNECT_WALLET);
          }, 100);
        }
      } else {
        toast.error(`Failed to connect wallet: ${connectError.message}`);
      }
    }
  }, [connectError, globalAddress, wagmiAccount.address, setSelectedPaymentMethod, onSelectPaymentMethod]);

  return (
    <div className="mx-auto w-[460px] max-w-full">
      <div className={cn("relative flex flex-col gap-10")}>
        {/* Header */}
        <button
          onClick={onBack}
          className="text-as-quaternary hover:text-as-primary absolute flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-around gap-4">
          <div className="flex-1 text-center">
            <h2 className="text-as-primary text-lg font-semibold">Choose payment method</h2>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex flex-col gap-3">
          {/* Connect Wallet Option */}
          {!globalAddress ? (
            // Not connected - show single connect button
            <button
              onClick={() => {
                // Prevent connecting if already connecting or if there's already a connection
                if (isConnecting) return;

                try {
                  // Check if wagmi already has a connection
                  if (wagmiAccount.isConnected && wagmiAccount.address) {
                    // Already connected via wagmi, just proceed with selection
                    console.log("Wagmi already connected, proceeding with selection");
                    setSelectedPaymentMethod(PaymentMethod.CONNECT_WALLET);
                    onSelectPaymentMethod(PaymentMethod.CONNECT_WALLET);
                    return;
                  }

                  // Check if global address exists (b3 account system)
                  if (globalAddress) {
                    // Already connected via global account, just proceed with selection
                    console.log("Global address already exists, proceeding with selection");
                    setSelectedPaymentMethod(PaymentMethod.CONNECT_WALLET);
                    onSelectPaymentMethod(PaymentMethod.CONNECT_WALLET);
                    return;
                  }

                  // Use the first available connector or a preferred one
                  const preferredConnector =
                    connectors.find(c => c.name.toLowerCase().includes("metamask")) || connectors[0];

                  if (preferredConnector) {
                    connect({ connector: preferredConnector });
                  }
                } catch (error) {
                  console.error("Connection error:", error);
                  toast.error("Failed to connect wallet. Please try again.");
                }
              }}
              disabled={isConnecting}
              className="bg-as-surface-primary border-as-border-secondary hover:border-as-secondary/80 group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <h4 className="text-as-primary font-semibold">Connect wallet</h4>
                  <p className="text-as-primary/60 text-sm">Connect your wallet to continue</p>
                </div>
              </div>
              {isConnecting ? (
                <div className="border-as-primary/20 border-t-as-primary h-5 w-5 animate-spin rounded-full border-2"></div>
              ) : (
                <ChevronRightCircle className="text-as-primary/40 group-hover:text-as-primary/60 h-5 w-5 transition-colors" />
              )}
            </button>
          ) : (
            // Connected - show wallet info
            <div className="bg-as-surface-primary border-as-border-secondary rounded-xl border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {globalWallet?.meta?.icon ? (
                    <img src={globalWallet.meta.icon} alt="Connected Wallet" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Wallet className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-as-primary font-semibold">Connected Wallet</span>
                    <span className="text-as-primary/60 text-sm">{shortenAddress(globalAddress)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPaymentMethod(PaymentMethod.CONNECT_WALLET);
                      onSelectPaymentMethod(PaymentMethod.CONNECT_WALLET);
                    }}
                    className="bg-as-brand hover:bg-as-brand/90 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
                  >
                    Use Wallet
                  </button>
                  <button
                    onClick={() => {
                      disconnect();
                      toast.success("Wallet disconnected");
                      if (selectedPaymentMethod === PaymentMethod.CONNECT_WALLET) {
                        setSelectedPaymentMethod(PaymentMethod.NONE);
                      }
                    }}
                    className="text-as-primary/60 hover:text-as-primary/80 rounded-lg p-1.5 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Crypto Option */}
          <button
            onClick={() => {
              setSelectedPaymentMethod(PaymentMethod.TRANSFER_CRYPTO);
              onSelectPaymentMethod(PaymentMethod.TRANSFER_CRYPTO);
            }}
            disabled={isCreatingOrder}
            className="bg-as-surface-primary border-as-border-secondary hover:border-as-secondary/80 group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex flex-col items-start text-left">
              <h4 className="text-as-primary font-semibold">Transfer crypto</h4>
            </div>
            <ChevronRightCircle className="text-as-primary/40 group-hover:text-as-primary/60 h-5 w-5 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
