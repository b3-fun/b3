"use client";

import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { thirdwebB3Mainnet } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { ChevronLeft, ChevronRightCircle, Wallet, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ConnectEmbed, lightTheme, useActiveWallet, useDisconnect as useThirdwebDisconnect } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { useDisconnect } from "wagmi";

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
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectThirdweb } = useThirdwebDisconnect();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Define available wallets for the modal
  const availableWallets = [
    createWallet("io.metamask"),
    // createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("walletConnect"),
    createWallet("io.rabby"),
    createWallet("app.phantom"),
  ];

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
            <h2 className="text-as-primary text-lg font-semibold">Choose payment method</h2>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="crypto-payment-methods flex flex-col gap-3">
          {/* Connect Wallet Option */}
          {!activeWallet ? (
            // Not connected - show single connect button
            <button
              onClick={() => setShowWalletModal(true)}
              className="crypto-payment-method-connect-wallet bg-as-surface-primary border-as-border-secondary hover:border-as-secondary/80 group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="wallet-icon flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <h4 className="text-as-primary font-semibold">Connect wallet</h4>
                  <p className="text-as-primary/60 text-sm">Choose from multiple wallet options</p>
                </div>
              </div>
              <ChevronRightCircle className="text-as-primary/40 group-hover:text-as-primary/60 h-5 w-5 transition-colors" />
            </button>
          ) : (
            // Connected - show wallet info
            <div className="crypto-payment-method-connect-wallet wallet-connected bg-as-surface-primary border-as-border-secondary rounded-xl border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {globalWallet?.meta?.icon ? (
                    <img src={globalWallet.meta.icon} alt="Connected Wallet" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="wallet-icon flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Wallet className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-as-primary font-semibold">Connected Wallet</span>
                    <span className="text-as-primary/60 text-sm">
                      {shortenAddress(activeWallet.getAccount()?.address || "")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                      onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                    }}
                    className="bg-as-brand hover:bg-as-brand/90 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
                  >
                    Use Wallet
                  </button>
                  <button
                    onClick={async () => {
                      disconnect();
                      disconnectThirdweb(activeWallet);
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
            </div>
          )}

          {/* Transfer Crypto Option */}
          <button
            onClick={() => {
              setSelectedPaymentMethod(CryptoPaymentMethodType.TRANSFER_CRYPTO);
              onSelectPaymentMethod(CryptoPaymentMethodType.TRANSFER_CRYPTO);
            }}
            disabled={isCreatingOrder}
            className="crypto-payment-method-transfer bg-as-surface-primary border-as-border-secondary hover:border-as-secondary/80 group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex flex-col items-start text-left">
              <h4 className="text-as-primary font-semibold">Transfer crypto</h4>
            </div>
            <ChevronRightCircle className="text-as-primary/40 group-hover:text-as-primary/60 h-5 w-5 transition-colors" />
          </button>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal &&
        createPortal(
          <div className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className="max-h-[80vh] w-[400px] max-w-[90vw] overflow-auto rounded-xl bg-white p-6 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect Wallet</h3>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ConnectEmbed
                client={client}
                chain={thirdwebB3Mainnet}
                wallets={availableWallets}
                showThirdwebBranding={false}
                theme={lightTheme()}
                onConnect={async wallet => {
                  console.log("Wallet connected:", wallet);
                  // setShowWalletModal(false);
                  setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                  onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                  setShowWalletModal(false);
                }}
                style={{
                  width: "100%",
                  minHeight: "300px",
                }}
              />
            </div>
          </div>,
          typeof window !== "undefined" ? document.getElementById("b3-root") || document.body : document.body,
        )}
    </div>
  );
}
