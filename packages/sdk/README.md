# @b3dotfun/sdk

A comprehensive TypeScript SDK for AnySpend cross-chain operations and B3 Global Accounts authentication. Provides both React components for easy integration and headless TypeScript services for custom implementations.

## Architecture

The SDK is organized into focused modules:

- **`anyspend/`** - Cross-chain execution engine functionality
- **`global-account/`** - B3 Global Accounts authentication and user management
- **`shared/`** - Common utilities, types, and components
- **`others/`** - Additional features and utilities

Each module contains:
- `react/` - React components and hooks
- `services/` - Headless TypeScript services
- `types/` - TypeScript definitions
- `utils/` - Utility functions
- `constants/` - Constants and configuration

## Platform Support

| Feature                | React Web | React Native |
| ---------------------- | --------- | ------------ |
| AnySpend               | ✅        | ❌           |
| Global Accounts        | ✅        | ✅           |
| Headless Services      | ✅        | ✅           |

## Installation

```bash
npm install @b3dotfun/sdk
# or
yarn add @b3dotfun/sdk
# or
pnpm add @b3dotfun/sdk
```

## CSS Styles

```tsx
import "@b3dotfun/sdk/index.css"; // Import default styles
```

# AnySpend

AnySpend enables cross-chain swaps, NFT minting, and other blockchain operations with a unified interface.

## React Components

### Basic Cross-Chain Swap

```tsx
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";

function CrossChainSwapPage() {
  return (
    <AnySpend
      isMainnet={true}
      mode="page"
    />
  );
}
```

### NFT Minting

```tsx
import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";

function NFTMinting() {
  const nftContract = {
    address: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
    chainId: 8333,
    name: "Example NFT Collection",
    imageUrl: "https://example.com/nft-image.jpg",
    description: "A beautiful NFT from our collection",
    price: "1000000000000000000", // 1 ETH in wei
    currency: {
      symbol: "ETH",
      decimals: 18
    }
  };

  return (
    <AnySpendNFTButton
      nftContract={nftContract}
      recipientAddress="0x..."
    />
  );
}
```

### Custom Integration with Provider

```tsx
import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";

function App() {
  return (
    <AnyspendProvider>
      <YourAnySpendComponents />
    </AnyspendProvider>
  );
}
```

## Headless TypeScript Services

### Token Operations

```typescript
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";

// Get available tokens for a chain
const tokens = await anyspendService.getTokenList(
  true, // isMainnet
  1,    // chainId (Ethereum)
  "usdc" // search query
);

// Get specific token details
const token = await anyspendService.getToken(
  true, // isMainnet
  1,    // chainId
  "0xA0b86a33E6c51c7C36c654d6C9e7b8F5d4a8b5c5" // token address
);
```

### Quote and Order Management

```typescript
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import type { GetQuoteRequest } from "@b3dotfun/sdk/anyspend/types";

// Get quote for cross-chain swap
const quoteRequest: GetQuoteRequest = {
  srcChain: 1,
  dstChain: 8333,
  srcTokenAddress: "0xA0b86a33E6c51c7C36c654d6C9e7b8F5d4a8b5c5",
  dstTokenAddress: "0x...",
  srcAmount: "1000000", // 1 USDC
  recipientAddress: "0x...",
  type: "swap"
};

const quote = await anyspendService.getQuote(true, quoteRequest);

// Create order
const order = await anyspendService.createOrder({
  isMainnet: true,
  recipientAddress: "0x...",
  type: "swap",
  srcChain: 1,
  dstChain: 8333,
  srcTokenAddress: "0x...",
  dstTokenAddress: "0x...",
  srcAmount: "1000000",
  payload: {},
  metadata: {}
});
```

### Order Tracking

```typescript
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";

// Get order details and transactions
const orderDetails = await anyspendService.getOrderAndTransactions(
  true, // isMainnet
  "order-id"
);

// Get order history for an address
const history = await anyspendService.getOrderHistory(
  true, // isMainnet
  "0x...", // creator address
  50, // limit
  0   // offset
);
```

## Utility Functions

```typescript
import { isNativeToken, getNativeToken } from "@b3dotfun/sdk/anyspend/utils";
import { formatAmount } from "@b3dotfun/sdk/anyspend/utils";

// Check if token is native
const isNative = isNativeToken("0x0000000000000000000000000000000000000000");

// Get native token info
const nativeToken = getNativeToken(1); // Ethereum

// Format token amounts
const formatted = formatAmount("1000000000000000000", 18); // "1.0"
```

# Global Accounts

B3 Global Accounts provide seamless authentication and user management across the B3 ecosystem.

## React Components

### Basic Authentication

```tsx
import { B3Provider, SignInWithB3 } from "@b3dotfun/sdk/global-account/react";

function App() {
  return (
    <B3Provider environment="production">
      <SignInWithB3
        provider={{ strategy: "google" }}
        partnerId="your-partner-id"
        onLoginSuccess={(globalAccount) => {
          console.log("Authenticated:", globalAccount);
        }}
      />
    </B3Provider>
  );
}
```

### Session Key Authentication

```tsx
import { B3Provider, SignInWithB3 } from "@b3dotfun/sdk/global-account/react";

const b3Chain = {
  id: 8333,
  name: "B3",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpc: "https://mainnet-rpc.b3.fun"
};

function SessionKeyAuth() {
  return (
    <B3Provider environment="production">
      <SignInWithB3
        provider={{ strategy: "google" }}
        chain={b3Chain}
        partnerId="your-partner-id"
        sessionKeyAddress="0x..." // MetaMask address
        onLoginSuccess={(globalAccount) => {
          console.log("Session key authenticated:", globalAccount);
        }}
      />
    </B3Provider>
  );
}
```

### Permission Management

```tsx
import { RequestPermissionsButton } from "@b3dotfun/sdk/global-account/react";

function PermissionsExample() {
  return (
    <RequestPermissionsButton
      chain={b3Chain}
      sessionKeyAddress="0x..."
      permissions={{
        approvedTargets: ["0x..."], // Contract addresses
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        nativeTokenLimitPerTransaction: 0.0001
      }}
      onSuccess={() => console.log("Permissions granted")}
      onError={(error) => console.error("Permission error:", error)}
    />
  );
}
```

### Account Management

```tsx
import { useB3 } from "@b3dotfun/sdk/global-account/react";

function AccountStatus() {
  const { account, isAuthenticated } = useB3();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {account?.displayName}!</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

## Headless TypeScript Services

### Authentication Service

```typescript
import { authenticate, resetSocket } from "@b3dotfun/sdk/global-account/app";

// Authenticate with B3 Global Account
const authResult = await authenticate(
  "access-token",
  "identity-token",
  { /* additional params */ }
);

if (authResult) {
  console.log("Authentication successful:", authResult);
} else {
  console.log("Authentication failed");
}

// Reset socket connection
resetSocket();
```

### Basement Integration

```typescript
import { authenticate as bsmntAuthenticate } from "@b3dotfun/sdk/global-account/bsmnt";

// Authenticate with Basement services
const bsmntAuth = await bsmntAuthenticate(
  "access-token",
  "identity-token"
);
```

### React Native Support

```typescript
// For React Native applications
import { authenticate } from "@b3dotfun/sdk/global-account/app";

// Authentication works the same way
const result = await authenticate("access-token", "identity-token");
```

## Server-Side Usage

```typescript
import { serverFunction } from "@b3dotfun/sdk/global-account/server";

// Server-side Global Account operations
// (Implementation depends on your specific needs)
```

# Shared Utilities

## Chain Management

```typescript
import { supportedChains } from "@b3dotfun/sdk/shared/constants/chains/supported";
import { b3Chain } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";

// Get supported chains
console.log(supportedChains);

// Use B3 chain configuration
console.log(b3Chain);
```

## Utility Functions

```typescript
import { cn } from "@b3dotfun/sdk/shared/utils/cn";

// Tailwind class name utility
const classes = cn("base-class", "conditional-class", {
  "active": isActive
});
```

## Thirdweb Integration

```typescript
import { thirdwebClient } from "@b3dotfun/sdk/shared/thirdweb/client";

// Pre-configured Thirdweb client
const client = thirdwebClient;
```

# Advanced Usage

## Modal System

```tsx
import { B3Provider } from "@b3dotfun/sdk/global-account/react";
import B3DynamicModal from "@b3dotfun/sdk/global-account/react/components/B3DynamicModal";

function App() {
  return (
    <B3Provider environment="production">
      <YourApp />
      <B3DynamicModal />
    </B3Provider>
  );
}
```

## Custom Styling

The SDK components support custom styling through CSS classes and CSS-in-JS solutions. All components are built with accessibility and customization in mind.

## TypeScript Support

All modules provide full TypeScript support with comprehensive type definitions:

```typescript
import type { GlobalAccount } from "@b3dotfun/sdk/global-account/types";
```

## Environment Configuration

```typescript
// Set environment variables
process.env.NEXT_PUBLIC_B3_API = "https://api.b3.fun";
process.env.NEXT_PUBLIC_BSMNT_API = "https://api.basement.fun";
```

## Error Handling

All services include proper error handling and type-safe responses:

```typescript
try {
  const result = await anyspendService.getQuote(true, quoteRequest);
  // Handle success
} catch (error) {
  // Handle error
  console.error("Quote failed:", error);
}
```

---

For more detailed examples and advanced usage patterns, refer to the individual module documentation and type definitions.
