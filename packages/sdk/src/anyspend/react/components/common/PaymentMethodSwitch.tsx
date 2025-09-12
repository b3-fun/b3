"use client";

import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";

interface PaymentMethodSwitchProps {
  currentMethod: CryptoPaymentMethodType;
  onMethodChange?: (method: CryptoPaymentMethodType) => void;
}

export function PaymentMethodSwitch({ currentMethod, onMethodChange }: PaymentMethodSwitchProps) {
  if (!onMethodChange) return null;

  const isTransferCrypto = currentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO;
  const isConnectWallet =
    currentMethod === CryptoPaymentMethodType.CONNECT_WALLET || currentMethod === CryptoPaymentMethodType.GLOBAL_WALLET;

  // Only show switch if we're in one of the payment states
  if (!isTransferCrypto && !isConnectWallet) return null;

  const handleSwitch = () => {
    if (isTransferCrypto) {
      onMethodChange(CryptoPaymentMethodType.CONNECT_WALLET);
    } else {
      onMethodChange(CryptoPaymentMethodType.TRANSFER_CRYPTO);
    }
  };

  return (
    <div className="order-details-payment-switch-container flex items-center justify-center">
      <button
        onClick={handleSwitch}
        className="order-details-payment-switch-btn text-as-primary/60 hover:text-as-primary text-sm underline transition-colors"
      >
        {isTransferCrypto ? "Switch to Connect Wallet" : "Switch to scan / manually send crypto"}
      </button>
    </div>
  );
}
