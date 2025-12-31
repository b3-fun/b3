"use client";

import { toast, useAccountWallet, useModalStore, WalletImage } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { ChevronLeft, ChevronRightCircle, Wallet, X, ZapIcon } from "lucide-react";
import { useConnectModal, useDisconnect, useWalletInfo } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { useConnectedWalletDisplay } from "../../hooks/useConnectedWalletDisplay";

export enum CryptoPaymentMethodType {
  NONE = "none",
  CONNECT_WALLET = "connect_wallet",
  GLOBAL_WALLET = "global_wallet",
  TRANSFER_CRYPTO = "transfer_crypto",
}

const recommendWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
];

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
  const { connectedEOAWallet, connectedSmartWallet } = useAccountWallet();
  const { disconnect } = useDisconnect();
  const { connect: openConnectModal } = useConnectModal();
  const { data: eoaWalletInfo } = useWalletInfo(connectedEOAWallet?.id);

  const globalAddress = connectedSmartWallet?.getAccount()?.address;

  // Use custom hook to determine wallet display logic
  const { shouldShowConnectedEOA } = useConnectedWalletDisplay(selectedPaymentMethod);

  // Get modal store to block parent modal closing while connect modal is open
  const setNestedModalOpen = useModalStore(state => state.setNestedModalOpen);

  // Handle wallet connection using thirdweb modal
  const handleConnectWallet = async () => {
    // Block parent B3 modal from closing while thirdweb connect modal is open
    setNestedModalOpen(true);

    try {
      // Disconnect current wallet before connecting a new one
      if (connectedEOAWallet) {
        disconnect(connectedEOAWallet);
      }

      const wallet = await openConnectModal({
        client,
        setActive: false,
        size: "compact",
        showThirdwebBranding: false,
        wallets: recommendWallets,
      });

      if (wallet) {
        setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
        onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
        toast.success("Wallet connected");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as any).message.toLowerCase();
        if (
          errorMessage.includes("rejected") ||
          errorMessage.includes("denied") ||
          errorMessage.includes("cancelled")
        ) {
          // User cancelled - no toast needed
        } else {
          toast.error("Failed to connect wallet");
        }
      }
    } finally {
      // Always re-enable parent modal closing when connect modal closes
      setNestedModalOpen(false);
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

        {/* Toast Testing Section - Remove this after testing */}
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 p-3 dark:bg-yellow-950/20">
            <p className="mb-2 text-xs font-semibold text-yellow-800 dark:text-yellow-300">🧪 Toast Test (Dev Only)</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toast.success("Success! Transaction completed")}
                className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
              >
                Success
              </button>
              <button
                onClick={() => toast.error("Error! Transaction failed")}
                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
              >
                Error
              </button>
              <button
                onClick={() => toast.info("Info: Processing your request...")}
                className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                Info
              </button>
              <button
                onClick={() => toast.warning("Warning: Low balance detected")}
                className="rounded bg-yellow-600 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-700"
              >
                Warning
              </button>
              <button
                onClick={() => {
                  toast.success("Multiple test 1");
                  setTimeout(() => toast.info("Multiple test 2"), 200);
                  setTimeout(() => toast.warning("Multiple test 3"), 400);
                }}
                className="rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700"
              >
                Multiple
              </button>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="crypto-payment-methods flex flex-col gap-4">
          {/* Installed Wallets Section */}
          {(shouldShowConnectedEOA || globalAddress) && (
            <div className="installed-wallets">
              <h3 className="text-as-primary/80 mb-3 text-sm font-medium">Connected wallets</h3>
              <div className="space-y-2">
                {/* Current Connected Wallet */}

                {shouldShowConnectedEOA && (
                  <button
                    onClick={() => {
                      setSelectedPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                      onSelectPaymentMethod(CryptoPaymentMethodType.CONNECT_WALLET);
                      toast.success(`Selected ${eoaWalletInfo?.name || "wallet"}`);
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
                            {eoaWalletInfo?.name || "Connected Wallet"}
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
                            if (connectedEOAWallet) {
                              disconnect(connectedEOAWallet);
                            }
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
                        <WalletImage
                          fallback={
                            <div className="wallet-icon flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                              <Wallet className="h-5 w-5 text-purple-600" />
                            </div>
                          }
                        />

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
                onClick={handleConnectWallet}
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
    </div>
  );
}
