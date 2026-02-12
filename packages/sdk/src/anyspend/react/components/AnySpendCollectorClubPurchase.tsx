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
import { PUBLIC_BASE_RPC_URL } from "@b3dotfun/sdk/shared/constants";
import { formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import React, { useEffect, useMemo, useState } from "react";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { base } from "viem/chains";
import { AnySpendCustom } from "./AnySpendCustom";

// Collector Club Shop contract addresses on Base
const CC_SHOP_ADDRESS = "0x47366E64E4917dd4DdC04Fb9DC507c1dD2b87294";
const CC_SHOP_ADDRESS_STAGING = "0x8b751143342ac41eB965E55430e3F7Adf6BE01fA";
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

// ABI for buyPacksForWithDiscount function (with discount code)
const BUY_PACKS_FOR_WITH_DISCOUNT_ABI = {
  inputs: [
    { internalType: "address", name: "user", type: "address" },
    { internalType: "uint256", name: "packId", type: "uint256" },
    { internalType: "uint256", name: "amount", type: "uint256" },
    { internalType: "string", name: "discountCode", type: "string" },
  ],
  name: "buyPacksForWithDiscount",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
} as const;

// ABI for isDiscountCodeValid view function
const IS_DISCOUNT_CODE_VALID_ABI = {
  inputs: [{ internalType: "string", name: "code", type: "string" }],
  name: "isDiscountCodeValid",
  outputs: [
    { internalType: "bool", name: "isValid", type: "bool" },
    { internalType: "uint256", name: "discountAmount", type: "uint256" },
  ],
  stateMutability: "view",
  type: "function",
} as const;

const basePublicClient = createPublicClient({
  chain: base,
  transport: http(PUBLIC_BASE_RPC_URL),
});

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
   * Optional spender address (defaults to shop address)
   */
  spenderAddress?: string;
  /**
   * Use staging contract address instead of production
   */
  isStaging?: boolean;
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
  /**
   * The partner ID
   */
  packType: string;
  /**
   * Force fiat payment
   */
  forceFiatPayment?: boolean;
  /**
   * Optional discount code to apply to the purchase.
   * When provided, validates on-chain and adjusts the price accordingly.
   */
  discountCode?: string;
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
  spenderAddress,
  isStaging = false,
  onSuccess,
  header,
  showRecipient = true,
  vendingMachineId,
  packType,
  forceFiatPayment,
  discountCode,
}: AnySpendCollectorClubPurchaseProps) {
  const ccShopAddress = isStaging ? CC_SHOP_ADDRESS_STAGING : CC_SHOP_ADDRESS;

  // Calculate total amount needed (pricePerPack * packAmount)
  const totalAmount = useMemo(() => {
    try {
      return (BigInt(pricePerPack) * BigInt(packAmount)).toString();
    } catch (error) {
      console.error("Failed to calculate total amount from props", { pricePerPack, packAmount, error });
      return "0";
    }
  }, [pricePerPack, packAmount]);

  // Discount code validation state
  const [discountInfo, setDiscountInfo] = useState<{
    isValid: boolean;
    discountAmount: bigint;
    isLoading: boolean;
    error: string | null;
  }>({
    isValid: false,
    discountAmount: BigInt(0),
    isLoading: false,
    error: null,
  });

  // Validate discount code on-chain when provided
  useEffect(() => {
    if (!discountCode) {
      setDiscountInfo({ isValid: false, discountAmount: BigInt(0), isLoading: false, error: null });
      return;
    }

    let cancelled = false;

    const validateDiscount = async () => {
      setDiscountInfo(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await basePublicClient.readContract({
          address: ccShopAddress as `0x${string}`,
          abi: [IS_DISCOUNT_CODE_VALID_ABI],
          functionName: "isDiscountCodeValid",
          args: [discountCode],
        });

        if (cancelled) return;

        const [isValid, discountAmount] = result;

        if (!isValid) {
          setDiscountInfo({
            isValid: false,
            discountAmount: BigInt(0),
            isLoading: false,
            error: "Invalid or expired discount code",
          });
          return;
        }

        setDiscountInfo({ isValid: true, discountAmount, isLoading: false, error: null });
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to validate discount code", { discountCode, error });
        setDiscountInfo({
          isValid: false,
          discountAmount: BigInt(0),
          isLoading: false,
          error: "Failed to validate discount code",
        });
      }
    };

    validateDiscount();

    return () => {
      cancelled = true;
    };
  }, [discountCode, ccShopAddress]);

  // Calculate effective dstAmount after discount
  const effectiveDstAmount = useMemo(() => {
    if (!discountCode || !discountInfo.isValid || discountInfo.discountAmount === BigInt(0)) {
      return totalAmount;
    }

    const total = BigInt(totalAmount);
    const discount = discountInfo.discountAmount;

    if (discount >= total) {
      console.error("Discount exceeds total price", { totalAmount, discountAmount: discount.toString() });
      return "0";
    }

    return (total - discount).toString();
  }, [totalAmount, discountCode, discountInfo.isValid, discountInfo.discountAmount]);

  // Calculate fiat amount (effectiveDstAmount in USD, assuming USDC with 6 decimals)
  const srcFiatAmount = useMemo(() => {
    if (!effectiveDstAmount || effectiveDstAmount === "0") return "0";
    return formatUnits(effectiveDstAmount, USDC_BASE.decimals);
  }, [effectiveDstAmount]);

  // Encode the contract function call (with or without discount)
  const encodedData = useMemo(() => {
    try {
      if (discountCode && discountInfo.isValid) {
        return encodeFunctionData({
          abi: [BUY_PACKS_FOR_WITH_DISCOUNT_ABI],
          functionName: "buyPacksForWithDiscount",
          args: [recipientAddress as `0x${string}`, BigInt(packId), BigInt(packAmount), discountCode],
        });
      }

      return encodeFunctionData({
        abi: [BUY_PACKS_FOR_ABI],
        functionName: "buyPacksFor",
        args: [recipientAddress as `0x${string}`, BigInt(packId), BigInt(packAmount)],
      });
    } catch (error) {
      console.error("Failed to encode function data", { recipientAddress, packId, packAmount, discountCode, error });
      return "0x";
    }
  }, [recipientAddress, packId, packAmount, discountCode, discountInfo.isValid]);

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

  // Don't render AnySpendCustom while discount is being validated (avoids showing wrong price)
  if (discountCode && discountInfo.isLoading) {
    return (
      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        <p className="text-as-secondary text-sm">Validating discount code...</p>
      </div>
    );
  }

  if (discountCode && discountInfo.error) {
    return (
      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-red-500">{discountInfo.error}</p>
      </div>
    );
  }

  if (discountCode && discountInfo.isValid && effectiveDstAmount === "0") {
    return (
      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-red-500">Discount exceeds total price</p>
      </div>
    );
  }

  return (
    <AnySpendCustom
      loadOrder={loadOrder}
      mode={mode}
      activeTab={activeTab}
      recipientAddress={recipientAddress}
      spenderAddress={spenderAddress ?? ccShopAddress}
      orderType="custom"
      dstChainId={BASE_CHAIN_ID}
      dstToken={paymentToken}
      dstAmount={effectiveDstAmount}
      contractAddress={ccShopAddress}
      encodedData={encodedData}
      metadata={{
        packId,
        packAmount,
        pricePerPack,
        vendingMachineId,
        packType,
        ...(discountCode && discountInfo.isValid
          ? { discountCode, discountAmount: discountInfo.discountAmount.toString() }
          : {}),
      }}
      header={header || defaultHeader}
      onSuccess={onSuccess}
      showRecipient={showRecipient}
      srcFiatAmount={srcFiatAmount}
      forceFiatPayment={forceFiatPayment}
    />
  );
}
