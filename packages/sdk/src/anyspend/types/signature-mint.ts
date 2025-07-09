export interface SigMintPayloadMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<Record<string, unknown>>;
}

export interface SigMintPayload {
  uri: string;
  tokenId: string;
  to: string;
  royaltyRecipient: string;
  quantity: string;
  royaltyBps: string;
  primarySaleRecipient: string;
  uid: string;
  metadata: SigMintPayloadMetadata;
  currencyAddress: string;
  price: string;
  mintStartTime: number;
  mintEndTime: number;
}

export interface SigMintCollection {
  _id: string;
  title: string;
  chainId: number;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  engineWallet: string;
  signatureRequestBody: {
    metadata: SigMintPayloadMetadata;
    price: string;
    currency: string;
    primarySaleRecipient: string;
    royaltyRecipient: string;
    royaltyBps: number;
    validityStartTimestamp: number;
    validityEndTimestamp: number;
    clonePrice: string;
  };
  maxSupply: number;
  isFreeMint: boolean;
  conditions: Array<unknown>;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSigMintParams {
  recipientAddress: string;
  contractAddress: string;
  chainId: number;
  quantity: string;
  prompt: string;
}

export interface GenerateSigMintResponse {
  signature: string;
  payload: SigMintPayload;
  collection: SigMintCollection;
}

export interface FindByAddressParams {
  address: string;
  chainId: number;
}

export interface IsMintEligibleParams {
  contractAddress: string;
  chainId: number;
  recipientAddress: string;
  quantity: string;
}

export interface IsMintEligibleResponse {
  eligible: boolean;
}

export interface FindAllParams {
  chainId: number;
}
