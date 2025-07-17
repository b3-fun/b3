# Installation & Setup

## Prerequisites

- **Node.js** v20.15.0+
- **React** 18/19
- **TypeScript** (recommended)

## Installation

### NPM

```bash
npm install @b3dotfun/sdk
```

### Yarn

```bash
yarn add @b3dotfun/sdk
```

### PNPM

```bash
pnpm add @b3dotfun/sdk
```

## Basic Setup

### 1. Provider Setup

Wrap your app with the `AnySpendProvider` to enable AnySpend functionality:

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

export default App;
```

### 2. Environment Configuration

AnySpend automatically configures API endpoints based on the `isMainnet` parameter:

- **Mainnet**: `https://mainnet.anyspend.com`
- **Testnet**: `http://testnet.anyspend.com`

### 3. TypeScript Configuration (Optional but Recommended)

If you're using TypeScript, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Verification

Create a simple test component to verify your setup:

```tsx
import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";

function TestComponent() {
  const testNFT = {
    chainId: 8333,
    contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
    price: "500000000000000000",
    priceFormatted: "0.5",
    currency: {
      chainId: 8333,
      address: "0x0000000000000000000000000000000000000000",
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    name: "Test NFT",
    description: "Testing AnySpend integration",
    imageUrl: "https://via.placeholder.com/300",
  };

  return (
    <AnySpendNFTButton
      nftContract={testNFT}
      recipientAddress="0x742d35Cc6634C0532925a3b8D07d77d9F05C4d57"
      isMainnet={false} // Use testnet for testing
      onSuccess={(txHash) => {
        console.log("Test successful!", txHash);
      }}
    />
  );
}
```

## Next Steps

- [Explore Components →](./components.md)
- [Learn about Hooks →](./hooks.md)
- [See Examples →](./examples.md) 