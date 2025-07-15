// ABI for ERC1155 signature minting
export const ABI_SIGNATURE_MINTING = [
  {
    inputs: [
      {
        components: [
          { name: "to", type: "address" },
          { name: "royaltyRecipient", type: "address" },
          { name: "royaltyBps", type: "uint256" },
          { name: "primarySaleRecipient", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "uri", type: "string" },
          { name: "quantity", type: "uint256" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "validityStartTimestamp", type: "uint128" },
          { name: "validityEndTimestamp", type: "uint128" },
          { name: "uid", type: "bytes32" },
        ],
        name: "_req",
        type: "tuple",
      },
      { name: "_signature", type: "bytes" },
    ],
    name: "mintWithSignature",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export const ABI_TRANSFER_SINGLE_EVENT = {
  anonymous: false,
  inputs: [
    { indexed: true, name: "operator", type: "address" },
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: false, name: "id", type: "uint256" },
    { indexed: false, name: "value", type: "uint256" },
  ],
  name: "TransferSingle",
  type: "event",
} as const;
