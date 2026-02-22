import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { shortenAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { ChevronRight } from "lucide-react";
import { CryptoPaymentMethodType } from "./CryptoPaymentMethod";

interface CryptoPaymentMethodDisplayProps {
  paymentMethod: CryptoPaymentMethodType;
  connectedAddress?: string | null;
  connectedName?: string | null;
}

/**
 * Displays the selected crypto payment method with appropriate label
 * - CONNECT_WALLET: Shows wallet address/name or "Connect wallet"
 * - GLOBAL_WALLET: Shows "Global Account"
 * - TRANSFER_CRYPTO: Shows "Transfer crypto"
 * - NONE: Shows "Select payment method"
 */
export function CryptoPaymentMethodDisplay({
  paymentMethod,
  connectedAddress,
  connectedName,
}: CryptoPaymentMethodDisplayProps) {
  if (paymentMethod === CryptoPaymentMethodType.CONNECT_WALLET) {
    return (
      <>
        {connectedAddress ? (
          <span className="text-as-tertiary whitespace-nowrap">
            {connectedName ? formatUsername(connectedName) : shortenAddress(connectedAddress)}
          </span>
        ) : (
          <span className="whitespace-nowrap">Connect wallet</span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0" />
      </>
    );
  }

  if (paymentMethod === CryptoPaymentMethodType.GLOBAL_WALLET) {
    return (
      <>
        <span className="whitespace-nowrap">Global Account</span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </>
    );
  }

  if (paymentMethod === CryptoPaymentMethodType.TRANSFER_CRYPTO) {
    return (
      <>
        <span className="whitespace-nowrap">Transfer crypto</span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </>
    );
  }

  // NONE or any other case
  return (
    <>
      <span className="whitespace-nowrap">Select payment method</span>
      <ChevronRight className="h-4 w-4 shrink-0" />
    </>
  );
}
