"use client";

import { IPFSMediaRenderer, useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useAccountWalletImage } from "@b3dotfun/sdk/global-account/react/hooks/useAccountWallet";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { WalletCoinbase, WalletMetamask, WalletPhantom, WalletRainbow, WalletWalletConnect } from "@web3icons/react";
import { ChevronLeft, ChevronRightCircle, Wallet, X, ZapIcon } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useSetActiveWallet, useWalletInfo } from "thirdweb/react";
import { WalletId, createWallet } from "thirdweb/wallets";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { useConnectedWalletDisplay } from "../../hooks/useConnectedWalletDisplay";

export enum CryptoPaymentMethodType {
  NONE = "none",
  CONNECT_WALLET = "connect_wallet",
  GLOBAL_WALLET = "global_wallet",
  TRANSFER_CRYPTO = "transfer_crypto",
}

interface CryptoPaymentMethodProps {
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
  const { connectedEOAWallet: connectedEOAWallet, connectedSmartWallet: connectedSmartWallet } = useAccountWallet();
  const { connector, address } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const setActiveWallet = useSetActiveWallet();
  const { data: eoaWalletInfo } = useWalletInfo(connectedEOAWallet?.id);

  const isConnected = !!connectedEOAWallet;
  const globalAddress = connectedSmartWallet?.getAccount()?.address;

  const walletImage = useAccountWalletImage();

  // Use custom hook to determine wallet display logic
  const { shouldShowConnectedEOA, shouldShowWagmiWallet } = useConnectedWalletDisplay(selectedPaymentMethod);
  console.log("shouldShowWagmiWallet :", shouldShowWagmiWallet);

  // Map wagmi connector names to thirdweb wallet IDs
  const getThirdwebWalletId = (connectorName: string): WalletId | null => {
    const walletMap: Record<string, WalletId> = {
      MetaMask: "io.metamask",
      "Coinbase Wallet": "com.coinbase.wallet",
      Rainbow: "me.rainbow",
      WalletConnect: "walletConnect",
      Phantom: "app.phantom",
    };
    return walletMap[connectorName] || null;
  };

  // Create thirdweb wallet from wagmi connector
  const createThirdwebWalletFromConnector = async (connectorName: string) => {
    const walletId = getThirdwebWalletId(connectorName);
    if (!walletId) {
      console.warn(`No thirdweb wallet ID found for connector: ${connectorName}`);
      return null;
    }

    try {
      const thirdwebWallet = createWallet(walletId);
      // Connect the wallet to sync with the existing wagmi connection
      await thirdwebWallet.connect({ client });
      return thirdwebWallet;
    } catch (error) {
      console.error(`Failed to create thirdweb wallet for ${connectorName}:`, error);
      return null;
    }
  };

  // Define available wallet connectors
  const availableConnectors = connectors.filter(connector =>
    ["MetaMask", "WalletConnect", "Coinbase Wallet", "Rainbow", "Phantom"].includes(connector.name),
  );

  // Define wallet options with icons and info
  const walletOptions = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: <WalletMetamask size={48} />,
      description: "Connect using MetaMask browser extension",
      connector: availableConnectors.find(c => c.name === "MetaMask"),
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: <WalletCoinbase size={48} />,
      description: "Connect using Coinbase Wallet",
      connector: availableConnectors.find(c => c.name === "Coinbase Wallet"),
    },
    {
      id: "rainbow",
      name: "Rainbow",
      icon: <WalletRainbow size={48} />,
      description: "Connect using Rainbow wallet",
      connector: availableConnectors.find(c => c.name === "Rainbow"),
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: <WalletWalletConnect size={48} />,
      description: "Connect using WalletConnect protocol",
      connector: availableConnectors.find(c => c.name === "WalletConnect"),
    },
    {
      id: "phantom",
      name: "Phantom",
      icon: <WalletPhantom size={48} />,
      description: "Connect using Phantom wallet",
      connector: availableConnectors.find(c => c.name === "Phantom"),
    },
  ].filter(wallet => wallet.connector); // Only show wallets that have available connectors

  // Reset modal state when closing
  const handleCloseModal = () => {
    setShowWalletModal(false);
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
    <div className="crypto-payment-method mx-auto h-fit w-[460px] max-w-full px-5 pb-5 pt-5 sm:px-0 sm:pt-5">
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
        <div className="crypto-payment-methods flex flex-col gap-4">
          {/* Installed Wallets Section */}
          {(shouldShowConnectedEOA || shouldShowWagmiWallet || globalAddress) && (
            <div className="installed-wallets">
              <h3 className="text-as-primary/80 mb-3 text-sm font-medium">Connected wallets</h3>
              <div className="space-y-2">
                {/* Current Connected Wallet */}

                {shouldShowConnectedEOA && (
                  <button
                    onClick={() => {
                      setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                      onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                      if (connectedEOAWallet) {
                        setActiveWallet(connectedEOAWallet);
                      }
                      toast.success(`Selected ${eoaWalletInfo?.name || connector?.name || "wallet"}`);
                    }}
                    className={cn(
                      "crypto-payment-method-connect-wallet eoa-wallet w-full rounded-xl border p-4 text-left transition-all hover:shadow-md",
                      selectedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET
                        ? "connected-wallet border-as-brand bg-as-brand/5"
                        : "border-as-border-secondary bg-as-surface-primary hover:border-as-secondary/80",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="wallet-icon flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Wallet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-as-primary font-semibold">
                            {eoaWalletInfo?.name || connector?.name || "Connected Wallet"}
                          </span>
                          <span className="text-as-primary/60 text-sm">
                            {shortenAddress(connectedEOAWallet?.getAccount()?.address || "")}
                          </span>
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
                )}

                {shouldShowWagmiWallet && (
                  <button
                    onClick={async () => {
                      setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                      onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);

                      // Create thirdweb wallet from wagmi connector
                      if (connector?.name) {
                        const thirdwebWallet = await createThirdwebWalletFromConnector(connector.name);
                        if (thirdwebWallet) {
                          setActiveWallet(thirdwebWallet);
                        }
                      }

                      toast.success(`Selected ${connector?.name || "wallet"}`);
                    }}
                    className={cn(
                      "crypto-payment-method-connect-wallet wagmi-wallet w-full rounded-xl border p-4 text-left transition-all hover:shadow-md",
                      selectedPaymentMethod === CryptoPaymentMethodType.CONNECT_WALLET
                        ? "connected-wallet border-as-brand bg-as-brand/5"
                        : "border-as-border-secondary bg-as-surface-primary hover:border-as-secondary/80",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="wallet-icon flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Wallet className="h-5 w-5 text-blue-600" />
                        </div>
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
                )}

                {/* Global Wallet (B3 Account) */}
                {globalAddress && (
                  <button
                    onClick={() => {
                      setSelectedPaymentMethod(CryptoPaymentMethodType.GLOBAL_WALLET);
                      onSelectPaymentMethod(CryptoPaymentMethodType.GLOBAL_WALLET);
                      toast.success("Selected B3 Account");
                    }}
                    className={cn(
                      "crypto-payment-method-global-wallet w-full rounded-xl border p-4 text-left transition-all hover:shadow-md",
                      selectedPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET
                        ? "connected-wallet border-as-brand bg-as-brand/5"
                        : "border-as-border-secondary bg-as-surface-primary hover:border-as-secondary/80",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {walletImage ? (
                          <IPFSMediaRenderer
                            src={walletImage}
                            alt="Global Account"
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="wallet-icon flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <Wallet className="h-5 w-5 text-purple-600" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-as-primary font-semibold">Global Account</span>
                          <span className="text-as-primary/60 text-sm">{shortenAddress(globalAddress || "")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPaymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET && (
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Other Payment Methods Section */}
          <div className="other-payment-methods">
            <h3 className="text-as-primary/80 mb-3 text-sm font-medium">Payment methods</h3>
            <div className="space-y-3">
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
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal &&
        createPortal(
          <div className="wallet-connection-modal pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className="max-h-[80vh] w-[400px] max-w-[90vw] overflow-auto rounded-xl bg-white p-6 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isConnected ? "Switch wallet or account" : "Choose wallet to connect"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Custom wallet options */}
                <div className="space-y-3">
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
                        className={`wallet-option w-full rounded-xl border p-4 text-left transition-all hover:shadow-md disabled:opacity-50 ${
                          isCurrentWallet
                            ? "wallet-option--active border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {walletOption.icon}

                            <div>
                              <div className="wallet-option-name flex items-center gap-2">
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
              </div>
            </div>
          </div>,
          typeof window !== "undefined" ? document.getElementById("b3-root") || document.body : document.body,
        )}
    </div>
  );
}
