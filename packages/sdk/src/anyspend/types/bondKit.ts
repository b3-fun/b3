export interface bondKitBuyForParams {
  recipientAddress: string;
  contractAddress: string;
  chainId: number;
  minTokensOut: string;
  ethAmount: string; // Amount of ETH to send in wei
  imageUrl?: string;
  tokenName?: string;
  loadOrder?: string;
  mode?: "modal" | "page";
  onSuccess?: (txHash?: string) => void;
}
