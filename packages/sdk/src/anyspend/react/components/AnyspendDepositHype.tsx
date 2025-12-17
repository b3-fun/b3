import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { base } from "viem/chains";
import { AnySpendCustomExactIn } from "./AnySpendCustomExactIn";

export const HYPE_TOKEN_DETAILS = {
  SYMBOL: "HYPE",
  LOGO_URI: "https://cdn.hypeduel.com/hypes-coin.svg",
};

export interface AnySpendDepositHypeProps {
  loadOrder?: string;
  mode?: "modal" | "page";
  recipientAddress: string;
  paymentType?: "crypto" | "fiat";
  sourceTokenAddress?: string;
  sourceTokenChainId?: number;
  onSuccess?: () => void;
  onOpenCustomModal?: () => void;
  mainFooter?: React.ReactNode;
  /**
   * Called when a token is selected. Call event.preventDefault() to prevent default token selection behavior.
   * Useful for handling special cases like B3 token selection.
   */
  onTokenSelect?: (token: components["schemas"]["Token"], event: { preventDefault: () => void }) => void;
  customUsdInputValues?: string[];
  preferEoa?: boolean;
  /** Custom URL to redirect to when clicking "Return to Home" on complete order screen */
  returnToHomeUrl?: string;
  /** Custom label for recipient display (e.g., "OBSN Telegram Bot") */
  customRecipientLabel?: string;
}

export function AnySpendDepositHype({
  loadOrder,
  mode = "modal",
  recipientAddress,
  paymentType = "crypto",
  sourceTokenAddress,
  sourceTokenChainId,
  onSuccess,
  onOpenCustomModal,
  mainFooter,
  onTokenSelect,
  customUsdInputValues,
  preferEoa,
  returnToHomeUrl,
  customRecipientLabel,
}: AnySpendDepositHypeProps) {
  if (!recipientAddress) return null;

  const header = () => (
    <div className="mb-4 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="text-as-primary text-xl font-bold">
          {paymentType === "crypto" ? "Deposit Crypto" : "Fund with Fiat"}
        </h1>
      </div>
    </div>
  );

  // Create a modified B3_TOKEN with HYPE branding
  const hypeToken: components["schemas"]["Token"] = {
    ...B3_TOKEN,
    symbol: HYPE_TOKEN_DETAILS.SYMBOL,
    metadata: {
      ...B3_TOKEN.metadata,
      logoURI: HYPE_TOKEN_DETAILS.LOGO_URI,
    },
  };

  return (
    <AnySpendCustomExactIn
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={recipientAddress}
      paymentType={paymentType}
      sourceTokenAddress={sourceTokenAddress}
      sourceTokenChainId={sourceTokenChainId}
      destinationToken={hypeToken}
      destinationChainId={base.id}
      orderType="hype_duel"
      minDestinationAmount={10}
      header={header}
      onSuccess={onSuccess}
      onOpenCustomModal={onOpenCustomModal}
      mainFooter={mainFooter}
      onTokenSelect={onTokenSelect}
      customUsdInputValues={customUsdInputValues}
      preferEoa={preferEoa}
    />
  );
}
