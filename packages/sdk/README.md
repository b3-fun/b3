# @b3dotfun/sdk

A comprehensive TypeScript SDK for AnySpend cross-chain operations and B3 Global Accounts authentication. Provides both React components for easy integration and headless TypeScript services for custom implementations.

## Architecture

The SDK is organized into focused modules:

- **`anyspend/`** - Cross-chain execution engine functionality
- **`global-account/`** - B3 Global Accounts authentication and user management
- **`notifications/`** - Multi-channel notification management
- **`shared/`** - Common utilities, types, and components
- **`others/`** - Additional features and utilities

Each module contains:

- `react/` - React components and hooks
- `services/` - Headless TypeScript services
- `types/` - TypeScript definitions
- `utils/` - Utility functions
- `constants/` - Constants and configuration

## Platform Support

| Feature           | React Web | React Native |
| ----------------- | --------- | ------------ |
| AnySpend          | ✅        | ❌           |
| Global Accounts   | ✅        | ✅           |
| Notifications     | ✅        | ✅           |
| Headless Services | ✅        | ✅           |

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
  return <AnySpend mode="page" />;
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
      decimals: 18,
    },
  };

  return <AnySpendNFTButton nftContract={nftContract} recipientAddress="0x..." />;
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
  1, // chainId (Ethereum)
  "usdc", // search query
);

// Get specific token details
const token = await anyspendService.getToken(
  1, // chainId
  "0xA0b86a33E6c51c7C36c654d6C9e7b8F5d4a8b5c5", // token address
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
  type: "swap",
};

const quote = await anyspendService.getQuote(quoteRequest);

// Create order
const order = await anyspendService.createOrder({
  recipientAddress: "0x...",
  type: "swap",
  srcChain: 1,
  dstChain: 8333,
  srcTokenAddress: "0x...",
  dstTokenAddress: "0x...",
  srcAmount: "1000000",
  payload: {},
  metadata: {},
});
```

### Order Tracking

```typescript
import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";

// Get order details and transactions
const orderDetails = await anyspendService.getOrderAndTransactions("order-id");

// Get order history for an address
const history = await anyspendService.getOrderHistory(
  "0x...", // creator address
  50, // limit
  0, // offset
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
        onLoginSuccess={globalAccount => {
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
  rpc: "https://mainnet-rpc.b3.fun",
};

function SessionKeyAuth() {
  return (
    <B3Provider environment="production">
      <SignInWithB3
        provider={{ strategy: "google" }}
        chain={b3Chain}
        partnerId="your-partner-id"
        sessionKeyAddress="0x..." // MetaMask address
        onLoginSuccess={globalAccount => {
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
        nativeTokenLimitPerTransaction: 0.0001,
      }}
      onSuccess={() => console.log("Permissions granted")}
      onError={error => console.error("Permission error:", error)}
    />
  );
}
```

### Account Management

```tsx
import { useB3 } from "@b3dotfun/sdk/global-account/react";

function AccountStatus() {
  const { account, isAuthenticated } = useB3();

  return <div>{isAuthenticated ? <p>Welcome, {account?.displayName}!</p> : <p>Please sign in</p>}</div>;
}
```

## Headless TypeScript Services

### Authentication Service

```typescript
import { authenticate, resetSocket } from "@b3dotfun/sdk/global-account/app";

// Authenticate with B3 Global Account
const authResult = await authenticate("access-token", "identity-token", {
  /* additional params */
});

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
const bsmntAuth = await bsmntAuthenticate("access-token", "identity-token");
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

# Notifications

B3 Notifications provides multi-channel notification management for your users with support for email, Telegram, Discord, SMS, WhatsApp, and in-app notifications.

## Features

- ✅ **Zero Config** - Automatically uses authenticated user's ID from JWT
- 🎯 **Type Safe** - Full TypeScript support
- ⚡ **React Hooks** - Easy integration with `useNotifications()` hook
- 🔐 **Secure** - JWT-based authentication
- 📱 **Multi-Channel** - Email, Telegram, Discord, SMS, WhatsApp, In-app
- 🚀 **Lightweight** - Minimal dependencies

## React Hook

### Basic Usage

```tsx
import { useNotifications } from "@b3dotfun/sdk/notifications/react";
import { setAuthToken } from "@b3dotfun/sdk/notifications";
import { useEffect } from "react";

function NotificationSettings() {
  const { user, loading, connectEmail, connectTelegram, isEmailConnected } = useNotifications();

  // Set auth token from your B3 authentication
  useEffect(() => {
    const token = "your-jwt-token"; // Get from your auth system
    setAuthToken(token);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {!isEmailConnected && <button onClick={() => connectEmail("user@example.com")}>Connect Email</button>}

      <button onClick={connectTelegram}>Connect Telegram</button>
    </div>
  );
}
```

### Full Hook API

```tsx
const {
  user, // User data with channels and settings
  loading, // Loading state
  error, // Error if any
  refresh, // Manually refresh user data
  connectEmail, // Connect email channel
  connectTelegram, // Connect Telegram channel
  updateChannel, // Update a channel
  deleteChannel, // Delete a channel
  // Convenience helpers
  isEmailConnected,
  isTelegramConnected,
  isDiscordConnected,
} = useNotifications();
```

## Headless API Client

### Authentication

```typescript
import { setAuthToken, clearAuthToken, notificationsAPI } from "@b3dotfun/sdk/notifications";

// Set JWT token (call after user logs in)
setAuthToken("your-jwt-token");

// Clear token (call on logout)
clearAuthToken();
```

### User Management

```typescript
import { notificationsAPI } from "@b3dotfun/sdk/notifications";

// Register current user
await notificationsAPI.registerUser();

// Get current user's profile
const userData = await notificationsAPI.getUser();

// Get notification history
const history = await notificationsAPI.getHistory("my-app-id", 50);
```

### Channel Management

```typescript
// Add any channel
await notificationsAPI.addChannel("email", "user@example.com");

// Connect email (shorthand)
await notificationsAPI.connectEmail("user@example.com");

// Update channel
await notificationsAPI.updateChannel("channel-id", {
  enabled: true,
});

// Delete channel
await notificationsAPI.deleteChannel("channel-id");
```

### Telegram Integration

```typescript
// Get Telegram deep link
const { deepLink, verificationCode, botUsername } = await notificationsAPI.getTelegramLink();
window.open(deepLink, "_blank");

// Check connection status
const { connected, chatId } = await notificationsAPI.checkTelegramStatus();
```

### App Preferences

```typescript
// Save notification preferences for an app
await notificationsAPI.savePreferences("my-app", {
  notificationType: "transaction",
  channels: ["email", "telegram", "in_app"],
});

// Get app settings
const settings = await notificationsAPI.getAppSettings("my-app");
```

### In-App Notifications

```typescript
// Get in-app notifications
const { notifications } = await notificationsAPI.getInAppNotifications();

// Mark notification as read
await notificationsAPI.markNotificationAsRead("notification-id");
```

### Send Notifications

```typescript
// Send a notification
await notificationsAPI.sendNotification({
  userId: "user-123",
  appId: "my-app",
  notificationType: "transaction",
  message: "Your transaction was successful!",
  title: "Transaction Complete",
  data: { transactionId: "tx-123" },
});
```

## TypeScript Types

```typescript
import type { UserData, NotificationChannel, ChannelType } from "@b3dotfun/sdk/notifications/types";

type ChannelType = "email" | "telegram" | "discord" | "sms" | "whatsapp" | "in_app";

interface NotificationChannel {
  id: number;
  channel_type: ChannelType;
  enabled: number;
  channel_identifier: string;
}

interface UserData {
  user: {
    id: number;
    user_id: string;
  };
  channels: NotificationChannel[];
  appSettings: Array<{
    app_id: string;
    notification_type: string;
    enabled: number;
    channels: string;
  }>;
}
```

## Next.js Example

```tsx
"use client";

import { useEffect } from "react";
import { setAuthToken, useNotifications } from "@b3dotfun/sdk/notifications/react";
import { useB3 } from "@b3dotfun/sdk/global-account/react";

export default function NotificationsPage() {
  const { jwt } = useB3(); // Get JWT from B3 authentication
  const { user, loading, connectEmail, connectTelegram, isEmailConnected, isTelegramConnected } = useNotifications();

  // Set auth token when available
  useEffect(() => {
    if (jwt) {
      setAuthToken(jwt);
    }
  }, [jwt]);

  if (loading) {
    return <div>Loading notification settings...</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Notification Settings</h1>

      <div className="rounded-lg border p-4">
        <h2>Email</h2>
        {isEmailConnected ? (
          <p className="text-green-600">✓ Connected</p>
        ) : (
          <button onClick={() => connectEmail("user@example.com")}>Connect Email</button>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <h2>Telegram</h2>
        {isTelegramConnected ? (
          <p className="text-green-600">✓ Connected</p>
        ) : (
          <button onClick={connectTelegram}>Connect Telegram</button>
        )}
      </div>
    </div>
  );
}
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
  active: isActive,
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
  const result = await anyspendService.getQuote(quoteRequest);
  // Handle success
} catch (error) {
  // Handle error
  console.error("Quote failed:", error);
}
```

---

For more detailed examples and advanced usage patterns, refer to the individual module documentation and type definitions.

## Local dev

If you are testing with one of the demos in this repo, simply make changes and they will reflect. If you are testing outside of this repo, follow the instructions below.

Initial setup

```
yalc publish # run this in sdk folder
yalc add @b3dotfun/sdk # run this in your other project
```

After making changes

```
yalc publish # run this in sdk folder
yalc update # run this in your other project
```

## Debugging

If you want to debug with existing logs that we provide, simply run this in your browser console, on the app you are debugging

```
localStorage.setItem('debug', '@@b3dotfun/sdk**')
```

Now, if you filter your console logs for `@@b3dotFun`, you will see several logs we provide.
