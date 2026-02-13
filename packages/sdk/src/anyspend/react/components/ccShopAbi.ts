// CCShop contract ABI fragments used by AnySpendCollectorClubPurchase

export const BUY_PACKS_FOR_ABI = {
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

export const BUY_PACKS_FOR_WITH_DISCOUNT_ABI = {
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

export const IS_DISCOUNT_CODE_VALID_FOR_PACK_ABI = {
  inputs: [
    { internalType: "string", name: "code", type: "string" },
    { internalType: "uint256", name: "packId", type: "uint256" },
  ],
  name: "isDiscountCodeValidForPack",
  outputs: [
    { internalType: "bool", name: "isValid", type: "bool" },
    { internalType: "uint256", name: "discountAmount", type: "uint256" },
  ],
  stateMutability: "view",
  type: "function",
} as const;

export const GET_DISCOUNT_CODE_ABI = {
  inputs: [{ internalType: "string", name: "code", type: "string" }],
  name: "getDiscountCode",
  outputs: [
    {
      components: [
        { internalType: "uint256", name: "discountAmount", type: "uint256" },
        { internalType: "uint256", name: "expiresAt", type: "uint256" },
        { internalType: "bool", name: "used", type: "bool" },
        { internalType: "bool", name: "exists", type: "bool" },
        { internalType: "uint256", name: "maxUses", type: "uint256" },
        { internalType: "uint256", name: "usedCount", type: "uint256" },
        { internalType: "uint256", name: "packId", type: "uint256" },
        { internalType: "uint256", name: "minPurchaseAmount", type: "uint256" },
      ],
      internalType: "struct CCShop.DiscountCode",
      name: "",
      type: "tuple",
    },
  ],
  stateMutability: "view",
  type: "function",
} as const;
