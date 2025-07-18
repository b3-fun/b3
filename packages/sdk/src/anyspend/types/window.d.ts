// Global window interface augmentations for AnySpend wallet providers

declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
      };
    };
  }
}

export {};
