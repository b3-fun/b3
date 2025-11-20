/**
 * AnySpend component for Collector Club pack purchases
 *
 * This component enables users to purchase Collector Club packs using any token via AnySpend.
 * It calls the `buyPacksFor` function on the Collector Club Shop contract on Base.
 * Uses exact-out flow to ensure the contract receives exactly the required USDC amount.
 *
 * @example
 * ```tsx
 * import { AnySpendCollectorClubPurchase } from "@b3dotfun/sdk";
 * import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
 *
 * function MyComponent() {
 *   return (
 *     <AnySpendCollectorClubPurchase
 *       packId={1}
 *       packAmount={5}
 *       pricePerPack="10000" // 0.01 USDC in wei (6 decimals)
 *       paymentToken={USDC_BASE}
 *       recipientAddress="0x123..."
 *       onSuccess={(txHash) => console.log("Purchase successful!", txHash)}
 *     />
 *   );
 * }
 * ```
 */
import { USDC_BASE } from "@b3dotfun/sdk/anyspend/constants";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GetQuoteResponse } from "@b3dotfun/sdk/anyspend/types/api_req_res";
import React, { useMemo } from "react";
import { encodeFunctionData } from "viem";
import { AnySpendCustom } from "./AnySpendCustom";

// Collector Club Shop contract on Base
const CC_SHOP_ADDRESS = "0x68B32D594E3c7E5B8cd8046BD66AfB0DB5b9BF9c";
const BASE_CHAIN_ID = 8453;

// ABI for buyPacksFor function only
const BUY_PACKS_FOR_ABI = {
  inputs: [
    { internalType: "address", name: "user", type: "address" },
    { internalType: "uint256", name: "packId", type: "uint256" },
    { internalType: "uint256", name: "amount", type: "uint256" },
  ],
  name: "buyPacksFor",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
} as const;

export interface AnySpendCollectorClubPurchaseProps {
  /**
   * Optional order ID to load existing order
   */
  loadOrder?: string;
  /**
   * Display mode
   */
  mode?: "modal" | "page";
  /**
   * Active tab (crypto or fiat payment)
   */
  activeTab?: "crypto" | "fiat";
  /**
   * The pack ID to purchase
   */
  packId: number;
  /**
   * The number of packs to purchase
   */
  packAmount: number;
  /**
   * Price per pack in wei (e.g., "10000" for 0.01 USDC with 6 decimals)
   */
  pricePerPack: string;
  /**
   * The payment token (defaults to USDC on Base)
   */
  paymentToken?: components["schemas"]["Token"];
  /**
   * Address that will receive the packs
   */
  recipientAddress: string;
  /**
   * Optional spender address (defaults to contract address)
   */
  spenderAddress?: string;
  /**
   * Success callback
   */
  onSuccess?: (txHash?: string) => void;
  /**
   * Optional custom header component
   */
  header?: (props: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => React.JSX.Element;
  /**
   * Show recipient selection (default: true)
   */
  showRecipient?: boolean;
  /**
   * The vending machine ID
   */
  vendingMachineId: string;
}

export function AnySpendCollectorClubPurchase({
  loadOrder,
  mode = "modal",
  activeTab = "crypto",
  packId,
  packAmount,
  pricePerPack,
  paymentToken = USDC_BASE,
  recipientAddress,
  spenderAddress = CC_SHOP_ADDRESS,
  onSuccess,
  header,
  showRecipient = true,
  vendingMachineId,
}: AnySpendCollectorClubPurchaseProps) {
  // Calculate total amount needed (pricePerPack * packAmount)
  const totalAmount = useMemo(() => {
    try {
      return (BigInt(pricePerPack) * BigInt(packAmount)).toString();
    } catch (error) {
      console.error("Failed to calculate total amount from props", { pricePerPack, packAmount, error });
      return "0";
    }
  }, [pricePerPack, packAmount]);

  // Encode the buyPacksFor function call
  const encodedData = useMemo(() => {
    try {
      return encodeFunctionData({
        abi: [BUY_PACKS_FOR_ABI],
        functionName: "buyPacksFor",
        args: [recipientAddress as `0x${string}`, BigInt(packId), BigInt(packAmount)],
      });
    } catch (error) {
      console.error("Failed to encode function data", { recipientAddress, packId, packAmount, error });
      return "0x";
    }
  }, [recipientAddress, packId, packAmount]);

  // Default header if not provided
  const defaultHeader = () => (
    <div className="mb-4 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="text-as-primary text-xl font-bold">Buy Collector Club Packs</h1>
        <p className="text-as-secondary text-sm">
          Purchase {packAmount} pack{packAmount !== 1 ? "s" : ""} using any token
        </p>
      </div>
    </div>
  );

  return (
    <AnySpendCustom
      loadOrder={loadOrder}
      mode={mode}
      activeTab={activeTab}
      recipientAddress={recipientAddress}
      spenderAddress={spenderAddress}
      orderType="custom"
      dstChainId={BASE_CHAIN_ID}
      dstToken={paymentToken}
      dstAmount={totalAmount}
      contractAddress={CC_SHOP_ADDRESS}
      encodedData={encodedData}
      metadata={{
        packId,
        packAmount,
        pricePerPack,
        vendingMachineId,
      }}
      header={header || defaultHeader}
      onSuccess={onSuccess}
      showRecipient={showRecipient}
    />
  );
}
