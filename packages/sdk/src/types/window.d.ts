// Global window interface augmentations for B3 SDK

declare global {
  interface Window {
    // AnySpend wallet providers
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
      };
    };
    // Google Analytics 4
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export {};
