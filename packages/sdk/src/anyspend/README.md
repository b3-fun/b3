# AnySpend SDK

**The fastest way to accept crypto payments and onboard users with zero friction.**

AnySpend gives you everything you need to add instant crypto onramps and checkout to your product. Let your users pay with any token on any chain, all in one seamless experience.

## ✨ Why AnySpend?

- 🚀 **Instant Onramp** — Users fund wallets directly from fiat and start spending immediately
- 💸 **Pay with Anything** — Accept payments in any token across any chain, no bridges required
- 🧩 **One SDK, Any Flow** — Easily integrate crypto payments into any business model
- 👛 **Unified Experience** — Users see and spend balances from all chains in one place

Perfect for NFT marketplaces, gaming, DeFi, e-commerce, and any application that needs seamless crypto payments.

## 🚀 Quick Start

### Installation

```bash
npm install @b3dotfun/sdk
```

### Basic Setup

```tsx
import { AnySpendProvider } from "@b3dotfun/sdk/anyspend/react";
import "@b3dotfun/sdk/index.css";

function App() {
  return (
    <AnySpendProvider>
      {/* Your app components */}
    </AnySpendProvider>
  );
}
```

### Your First Payment

```tsx
import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";

function NFTCard() {
  const nftContract = {
    chainId: 8333,
    contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
    price: "500000000000000000", // 0.5 ETH in wei
    priceFormatted: "0.5",
    currency: {
      chainId: 8333,
      address: "0x0000000000000000000000000000000000000000",
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    name: "Cool NFT",
    description: "A really cool NFT",
    imageUrl: "https://example.com/nft.png",
  };

  return (
    <AnySpendNFTButton
      nftContract={nftContract}
      recipientAddress="0x..." // User's wallet address
      onSuccess={(txHash) => {
        console.log("NFT purchased!", txHash);
      }}
    />
  );
}
```

That's it! Your users can now purchase NFTs with any token from any supported chain.

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [📦 Installation & Setup](./docs/installation.md) | Get started with AnySpend in your project |
| [🧩 Components API](./docs/components.md) | Pre-built React components for common use cases |
| [🪝 Hooks API](./docs/hooks.md) | React hooks for custom implementations |
| [💡 Examples & Use Cases](./docs/examples.md) | Real-world integration examples |
| [⚠️ Error Handling](./docs/error-handling.md) | Error handling patterns and troubleshooting |
| [🤝 Contributing](./docs/contributing.md) | How to contribute to AnySpend |

## 🎯 What You Can Build

### Cross-Chain DeFi
```tsx
<AnySpend 
  mode="page"
  recipientAddress={userAddress}
  onSuccess={(txHash) => updatePortfolio(txHash)}
/>
```

### NFT Marketplaces
```tsx
<AnySpendNFTButton
  nftContract={nftDetails}
  recipientAddress={userAddress}
  onSuccess={(txHash) => showSuccess(txHash)}
/>
```

### Gaming & Staking
```tsx
<AnySpendCustom
  orderType="custom"
  contractAddress="0x..."
  encodedData="0x..." // stake() function call
  onSuccess={(txHash) => updateStakePosition(txHash)}
/>
```

### Fiat Onboarding
```tsx
<AnySpend
  defaultActiveTab="fiat"
  destinationTokenAddress="0x..." // USDC
  recipientAddress={userAddress}
/>
```

## 🌐 Supported Networks

- **Ethereum** (Mainnet & Sepolia)
- **Base** (Mainnet & Sepolia) 
- **B3** (Mainnet & Testnet)
- **More networks coming soon**

## 🛠️ Platform Support

| Platform | Components | Hooks | Services |
|----------|------------|-------|----------|
| **React Web** | ✅ | ✅ | ✅ |
| **React Native** | 🚧 | ✅ | ✅ |
| **Node.js** | ❌ | ❌ | ✅ |

## 💬 Community & Support

- 📚 **[Live Demo](https://anyspend.com)** — Try AnySpend in action
- 💬 **[Discord](https://discord.gg/b3dotfun)** — Join our developer community  
- 🐛 **[GitHub Issues](https://github.com/b3-fun/b3/issues)** — Report bugs or request features
- 📖 **[Full Documentation](https://docs.b3.fun)** — Complete guides and API reference

---

**Ready to revolutionize payments in your app?** [Get started with the installation guide →](./docs/installation.md)



