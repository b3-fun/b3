"use client";

import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { ChevronLeft, ChevronRightCircle, Wallet, X, ZapIcon } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";

export enum CryptoPaymentMethodType {
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
  selectedPaymentMethod: CryptoPaymentMethodType;
  setSelectedPaymentMethod: (method: CryptoPaymentMethodType) => void;
  isCreatingOrder: boolean;
  onBack: () => void;
  onSelectPaymentMethod: (method: CryptoPaymentMethodType) => void;
}

export function CryptoPaymentMethod({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  isCreatingOrder,
  onBack,
  onSelectPaymentMethod,
}: CryptoPaymentMethodProps) {
  const { wallet: globalWallet } = useAccountWallet();
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedWalletConnector, setSelectedWalletConnector] = useState<any>(null);
  const [modalStep, setModalStep] = useState<"wallet-selection" | "account-selection">("wallet-selection");

  // Define available wallet connectors
  const availableConnectors = connectors.filter(connector =>
    ["MetaMask", "WalletConnect", "Coinbase Wallet", "Rainbow"].includes(connector.name),
  );

  // Define wallet options with icons and info
  const walletOptions = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "🦊",
      description: "Connect using MetaMask browser extension",
      connector: availableConnectors.find(c => c.name === "MetaMask"),
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: "🔵",
      description: "Connect using Coinbase Wallet",
      connector: availableConnectors.find(c => c.name === "Coinbase Wallet"),
    },
    {
      id: "rainbow",
      name: "Rainbow",
      icon: "🌈",
      description: "Connect using Rainbow wallet",
      connector: availableConnectors.find(c => c.name === "Rainbow"),
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: "🔗",
      description: "Connect using WalletConnect protocol",
      connector: availableConnectors.find(c => c.name === "WalletConnect"),
    },
  ].filter(wallet => wallet.connector); // Only show wallets that have available connectors

  // Reset modal state when closing
  const handleCloseModal = () => {
    setShowWalletModal(false);
    setModalStep("wallet-selection");
    setSelectedWalletConnector(null);
  };

  // Function to request wallet permissions for specific wallet
  const requestWalletPermissions = async (walletConnector?: any) => {
    try {
      // If a specific wallet connector is provided and it's different from current
      if (walletConnector && connector?.name !== walletConnector.name) {
        // Disconnect current and connect to the selected wallet
        // if (isConnected) {
        //   disconnect();
        //   // Small delay to ensure disconnection
        //   await new Promise(resolve => setTimeout(resolve, 100));
        // }
        await connect({ connector: walletConnector });
        setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
        onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
        toast.success(`Connected to ${walletConnector.name}`);
        return;
      }

      // If same wallet or no specific wallet, request permissions for account switching
      if (walletClient && "request" in walletClient) {
        await walletClient.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        toast.success("Account selection completed");
        setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
        onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
      } else {
        // Fallback: show modal for manual wallet selection
        setShowWalletModal(true);
      }
    } catch (error) {
      console.error("Failed to request wallet permissions:", error);
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as any).message.toLowerCase();
        if (
          errorMessage.includes("rejected") ||
          errorMessage.includes("denied") ||
          errorMessage.includes("cancelled")
        ) {
          toast.error("Account selection cancelled");
        } else {
          toast.error("Failed to open account selection");
        }
      } else {
        toast.error("Failed to open account selection");
      }
    }
  };

  return (
    <div className="crypto-payment-method mx-auto h-fit w-[460px] max-w-full">
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
            <h2 className="text-as-primary text-lg font-semibold">Select a payment method</h2>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="crypto-payment-methods flex flex-col gap-6">
          {/* Connect Wallet Section */}
          <button
            onClick={() => {
              // Always show wallet selection modal first
              setShowWalletModal(true);
            }}
            className="crypto-payment-method-connect-wallet bg-as-surface-primary border-as-border-secondary hover:border-as-secondary/80 group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="wallet-icon flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h4 className="text-as-primary font-semibold">Connect wallet</h4>
              </div>
            </div>
            <ChevronRightCircle className="text-as-primary/40 group-hover:text-as-primary/60 h-5 w-5 transition-colors" />
          </button>

          {/* Transfer Crypto Section */}
          <button
            onClick={() => {
              setSelectedPaymentMethod(CryptoPaymentMethodType.TRANSFER_CRYPTO);
              onSelectPaymentMethod(CryptoPaymentMethodType.TRANSFER_CRYPTO);
            }}
            disabled={isCreatingOrder}
            className="crypto-payment-method-transfer bg-as-surface-primary border-as-border-secondary hover:border-as-secondary/80 group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="wallet-icon flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <ZapIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h4 className="text-as-primary font-semibold">Transfer crypto</h4>
              </div>
            </div>
            <ChevronRightCircle className="text-as-primary/40 group-hover:text-as-primary/60 h-5 w-5 transition-colors" />
          </button>

          {/* Installed Wallets Section */}
          {isConnected && (
            <div className="installed-wallets">
              <h3 className="text-as-primary/80 mb-3 text-sm font-medium">Connected wallets</h3>
              <div className="space-y-2">
                {/* Current Connected Wallet */}
                <button
                  onClick={() => {
                    setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                    onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                    toast.success(`Selected ${connector?.name || "wallet"}`);
                  }}
                  className={cn(
                    "crypto-payment-method-connect-wallet w-full rounded-xl border p-4 text-left transition-all hover:shadow-md",
                    selectedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET
                      ? "connected-wallet border-as-brand bg-as-brand/5"
                      : "border-as-border-secondary bg-as-surface-primary hover:border-as-secondary/80",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {globalWallet?.meta?.icon ? (
                        <img src={globalWallet.meta.icon} alt="Wallet" className="h-10 w-10 rounded-full" />
                      ) : (
                        <div className="wallet-icon flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Wallet className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-as-primary font-semibold">{connector?.name || "Connected Wallet"}</span>
                        <span className="text-as-primary/60 text-sm">{shortenAddress(address || "")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET && (
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          disconnect();
                          toast.success("Wallet disconnected");
                          if (selectedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET) {
                            setSelectedPaymentMethod(CryptoPaymentMethodType.NONE);
                          }
                        }}
                        className="text-as-primary/60 hover:text-as-primary/80 rounded-lg p-1.5 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal &&
        createPortal(
          <div className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className="max-h-[80vh] w-[400px] max-w-[90vw] overflow-auto rounded-xl bg-white p-6 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {modalStep === "account-selection" && (
                    <button
                      onClick={() => setModalStep("wallet-selection")}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {modalStep === "wallet-selection"
                      ? "Select a payment method"
                      : `Connect ${selectedWalletConnector?.name}`}
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {modalStep === "wallet-selection" ? (
                  <>
                    {/* Custom wallet options */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isConnected ? "Switch wallet or account" : "Choose wallet to connect"}
                      </h4>
                      {walletOptions.map(walletOption => {
                        const isCurrentWallet = isConnected && connector?.name === walletOption.connector?.name;

                        return (
                          <button
                            key={walletOption.id}
                            onClick={async () => {
                              handleCloseModal();
                              await requestWalletPermissions(walletOption.connector);
                            }}
                            disabled={isPending}
                            className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-md disabled:opacity-50 ${
                              isCurrentWallet
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
                                    isCurrentWallet ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-700"
                                  }`}
                                >
                                  {walletOption.icon}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {walletOption.name}
                                    </div>
                                    {isCurrentWallet && (
                                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                                        Connected
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {isCurrentWallet ? "Switch account or reconnect" : walletOption.description}
                                  </div>
                                </div>
                              </div>
                              <ChevronRightCircle className="h-5 w-5 text-gray-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Account Selection Step */
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect to {selectedWalletConnector?.name} to view available accounts
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          // Disconnect current wallet first if switching
                          if (isConnected && connector?.name !== selectedWalletConnector?.name) {
                            disconnect();
                          }
                          await connect({ connector: selectedWalletConnector });
                          setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                          onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                          handleCloseModal();
                          toast.success(`Connected to ${selectedWalletConnector.name}`);
                        } catch (error) {
                          toast.error(`Failed to connect to ${selectedWalletConnector.name}`);
                          console.error("Connection error:", error);
                        }
                      }}
                      disabled={isPending}
                      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-center transition-all hover:border-gray-300 hover:shadow-md disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                          <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {isPending
                              ? `Connecting to ${selectedWalletConnector?.name}...`
                              : `Connect ${selectedWalletConnector?.name}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {isPending ? "Please check your wallet" : "Click to connect and select account"}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          typeof window !== "undefined" ? document.getElementById("b3-root") || document.body : document.body,
        )}
    </div>
  );
}
