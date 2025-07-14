export const ABI_BONDKIT_BUY_FOR = {
  inputs: [
    { internalType: "address", name: "_recipient", type: "address" },
    { internalType: "uint256", name: "_minTokensOut", type: "uint256" },
  ],
  name: "buyFor",
  outputs: [],
  stateMutability: "payable",
  type: "function",
} as const;
