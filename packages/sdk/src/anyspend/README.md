# AnySpend SDK Documentation

AnySpend is a powerful cross-chain protocol that enables seamless token swaps, NFT minting, tournament participation, and custom smart contract interactions across multiple blockchain networks. Built for developers who want to provide their users with a frictionless Web3 experience.

## 📦 Overview

AnySpend handles the complexity of cross-chain operations, gas management, and payment processing, allowing users to:

- **Cross-chain Swaps**: Swap tokens across different blockchain networks
- **NFT Minting**: Mint NFTs with automatic payment handling
- **Custom Interactions**: Execute any smart contract operations (tournaments, staking, gaming, etc.)
- **Fiat Onramp**: Convert fiat currency to crypto using integrated payment providers
- **Gasless Transactions**: Users don't need to worry about gas fees

### Key Features

- **Multi-chain Support**: Works across Ethereum, Base, B3, and other supported networks
- **Payment Flexibility**: Accept payments in various cryptocurrencies or fiat
- **Order Management**: Track transaction status in real-time
- **Error Recovery**: Automatic refund handling for failed transactions
- **React Integration**: Pre-built components for easy integration
- **TypeScript Support**: Full type safety and IntelliSense

## 🚀 Getting Started

### Prerequisites

- Node.js v18.0.0+
- React 18/19

### Installation

```bash
npm install @b3dotfun/sdk
# or
pnpm add @b3dotfun/sdk
```

### Basic Setup

```tsx
import { AnySpendProvider } from "@b3dotfun/sdk/anyspend/react";
import "@b3dotfun/sdk/index.css";

function App() {
  return <AnySpendProvider>{/* Your app components */}</AnySpendProvider>;
}
```

### Quick Start Example

```tsx
import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";

function NFTMinting() {
  const nftContract = {
    chainId: 8333, // B3 network
    contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
    price: "500000000000000000", // 0.5 ETH in wei
    priceFormatted: "0.5",
    currency: {
      chainId: 8333,
      address: "0x0000000000000000000000000000000000000000", // ETH
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    name: "Cool NFT",
    description: "A really cool NFT",
    imageUrl: "https://example.com/nft.png"
  };

  return (
    <AnySpendNFTButton
      nftContract={nftContract}
      recipientAddress="0x..." // User's wallet address
      onSuccess={txHash => {
        console.log("NFT minted successfully!", txHash);
      }}
    />
  );
}
```

## 📚 API Reference

### Components

#### `<AnySpend>`

The main swap interface component for token-to-token exchanges.

```tsx
<AnySpend
  isMainnet={true}
  mode="modal" // or "page"
  defaultActiveTab="crypto" // or "fiat"
  destinationTokenAddress="0x..." // For buy mode
  destinationTokenChainId={8333}
  recipientAddress="0x..."
  hideTransactionHistoryButton={false}
  onSuccess={txHash => console.log("Swap completed", txHash)}
/>
```

**Props:**

- `isMainnet?: boolean` - Whether to use mainnet or testnet (default: `true`)
- `mode?: "modal" | "page"` - Display mode (default: `"modal"`)
- `defaultActiveTab?: "crypto" | "fiat"` - Initial payment method (default: `"crypto"`)
- `destinationTokenAddress?: string` - For buy mode, specify the target token
- `destinationTokenChainId?: number` - Chain ID of the destination token
- `recipientAddress?: string` - Where to send the swapped tokens
- `hideTransactionHistoryButton?: boolean` - Hide the transaction history button
- `loadOrder?: string` - Load a specific order by ID
- `onSuccess?: (txHash?: string) => void` - Success callback

#### `<AnySpendNFTButton>`

A simple button component for NFT minting.

```tsx
<AnySpendNFTButton
  nftContract={{
    chainId: 8333,
    contractAddress: "0x...",
    price: "1000000000000000000", // 1 ETH in wei
    priceFormatted: "1.0",
    currency: {
      /* token details */
    },
    name: "My NFT",
    description: "NFT description",
    imageUrl: "https://example.com/image.png"
  }}
  recipientAddress="0x..."
  isMainnet={true}
/>
```

#### `<AnySpendCustom>`

For custom smart contract interactions.

```tsx
<AnySpendCustom
  orderType={OrderType.Custom}
  dstChainId={8333}
  dstToken={
    {
      /* token details */
    }
  }
  dstAmount="1000000000000000000" // Amount in wei
  contractAddress="0x..." // Target contract
  encodedData="0x..." // Encoded function call
  spenderAddress="0x..." // Optional spender
  metadata={
    {
      /* custom metadata */
    }
  }
  header={({ anyspendPrice, isLoadingAnyspendPrice }) => <div>Custom header content</div>}
  onSuccess={txHash => console.log("Custom order completed", txHash)}
/>
```

> **Note**: For specific use cases like staking, spin wheels, or other gaming mechanics, there are specialized components available (`AnySpendStakeB3`, `AnySpendBuySpin`, etc.). However, `AnySpendCustom` provides the most flexibility for any smart contract interaction.

### Hooks

#### `useAnyspendQuote`

Get pricing information for a potential order.

```tsx
import { useAnyspendQuote, OrderType, TradeType } from "@b3dotfun/sdk/anyspend";

const { anyspendQuote, isLoadingAnyspendQuote, getAnyspendQuoteError } = useAnyspendQuote(
  true, // isMainnet
  {
    srcChain: 1, // Ethereum
    dstChain: 8333, // B3
    srcTokenAddress: "0x...", // USDC
    dstTokenAddress: "0x...", // Target token
    type: OrderType.Swap,
    tradeType: TradeType.EXACT_INPUT,
    amount: "1000000" // 1 USDC (6 decimals)
  }
);
```

#### `useAnyspendCreateOrder`

Create a new AnySpend order.

```tsx
import { useAnyspendCreateOrder, OrderType } from "@b3dotfun/sdk/anyspend";

const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
  onSuccess: data => {
    console.log("Order created:", data.data.id);
  },
  onError: error => {
    console.error("Order creation failed:", error.message);
  }
});

// Create order
createOrder({
  isMainnet: true,
  recipientAddress: "0x...",
  orderType: OrderType.Swap,
  srcChain: 1,
  dstChain: 8333,
  srcToken: {
    /* source token details */
  },
  dstToken: {
    /* destination token details */
  },
  srcAmount: "1000000",
  expectedDstAmount: "500000000000000000",
  creatorAddress: "0x..."
});
```

#### `useAnyspendOrderAndTransactions`

Track order status and associated transactions.

```tsx
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend";

const { orderAndTransactions, getOrderAndTransactionsError } = useAnyspendOrderAndTransactions(
  true, // isMainnet
  "order-id-here"
);

if (orderAndTransactions) {
  const { order, depositTxs, relayTx, executeTx, refundTxs } = orderAndTransactions.data;
  console.log("Order status:", order.status);
  console.log("Deposit transactions:", depositTxs);
  console.log("Execution transaction:", executeTx);
}
```

#### `useAnyspendOrderHistory`

Get order history for a user.

```tsx
import { useAnyspendOrderHistory } from "@b3dotfun/sdk/anyspend";

const { orderHistory, isLoadingOrderHistory } = useAnyspendOrderHistory(
  true, // isMainnet
  "0x...", // creatorAddress
  50, // limit
  0 // offset
);
```

### Service Functions

For advanced use cases, you can use the service layer directly:

```tsx
import { anyspendService } from "@b3dotfun/sdk/anyspend/services";

// Get quote
const quote = await anyspendService.getQuote(true, {
  srcChain: 1,
  dstChain: 8333,
  srcTokenAddress: "0x...",
  dstTokenAddress: "0x...",
  type: "swap",
  tradeType: "exactInput",
  amount: "1000000"
});

// Get token list
const tokens = await anyspendService.getTokenList(true, 1, "USDC");

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
  payload: {
    /* order payload */
  },
  metadata: {
    /* order metadata */
  }
});
```

## 🔧 Environment Configuration

### Environment Variables

```bash
# Optional: Custom AnySpend API endpoints
NEXT_PUBLIC_ANYSPEND_BASE_URL=https://your-custom-anyspend-api.com
```

### Network Configuration

AnySpend automatically configures API endpoints based on the `isMainnet` parameter:

- **Mainnet**: `https://anyspend-mainnet.up.railway.app`
- **Testnet**: `https://anyspend-testnet.up.railway.app`

## 💼 Common Use Cases

### 1. Cross-Chain Token Swap

```tsx
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";

function TokenSwap() {
  return (
    <AnySpend
      mode="page"
      recipientAddress="0x..."
      onSuccess={txHash => {
        console.log("Swap completed:", txHash);
        // Redirect user or show success message
      }}
    />
  );
}
```

### 2. NFT Marketplace Integration

```tsx
import { AnySpendNFT } from "@b3dotfun/sdk/anyspend/react";

function NFTCard({ nft }) {
  return (
    <div className="nft-card">
      <img src={nft.imageUrl} alt={nft.name} />
      <h3>{nft.name}</h3>
      <p>{nft.description}</p>
      <AnySpendNFT
        nftContract={nft}
        recipientAddress={userAddress}
        onSuccess={txHash => {
          // Update UI to show NFT as owned
          updateNFTOwnership(nft.id, userAddress);
        }}
      />
    </div>
  );
}
```

### 3. Custom Contract Interaction - Staking Example

```tsx
import { AnySpendCustom, OrderType } from "@b3dotfun/sdk/anyspend/react";

function StakingInterface({ stakingContract }) {
  return (
    <AnySpendCustom
      orderType={OrderType.Custom}
      dstChainId={stakingContract.chainId}
      dstToken={stakingContract.stakingToken}
      dstAmount={stakingContract.stakeAmount}
      contractAddress={stakingContract.contractAddress}
      encodedData={stakingContract.stakeCalldata} // encoded stake() function call
      metadata={{
        action: "stake",
        staking: {
          contractAddress: stakingContract.contractAddress,
          amount: stakingContract.stakeAmount,
          duration: stakingContract.duration
        }
      }}
      header={({ anyspendPrice }) => (
        <div className="staking-header">
          <h2>Stake {stakingContract.stakingToken.symbol}</h2>
          <p>
            Amount: {stakingContract.stakeAmountFormatted} {stakingContract.stakingToken.symbol}
          </p>
          <p>Duration: {stakingContract.duration} days</p>
        </div>
      )}
      onSuccess={txHash => {
        console.log("Staking completed:", txHash);
        // Update UI to show staked amount
      }}
    />
  );
}
```

### 4. Fiat to Crypto Onramp

```tsx
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";

function FiatOnramp() {
  return (
    <AnySpend
      defaultActiveTab="fiat"
      destinationTokenAddress="0x..." // Target token to buy
      destinationTokenChainId={8333}
      recipientAddress="0x..."
      onSuccess={txHash => {
        console.log("Fiat purchase completed:", txHash);
      }}
    />
  );
}
```

## ⚠️ Error Handling

### Order Status Types

AnySpend orders go through various states:

```typescript
enum OrderStatus {
  // Preparation
  ScanningDepositTransaction = "scanning_deposit_transaction",
  WaitingStripePayment = "waiting_stripe_payment",
  ObtainToken = "obtain_token",

  // Execution
  SendingTokenFromVault = "sending_token_from_vault",
  Relay = "relay",
  Executed = "executed",

  // Failure/Refund
  ObtainFailed = "obtain_failed",
  Expired = "expired",
  Refunding = "refunding",
  Refunded = "refunded",
  Failure = "failure"
}
```

### Common Error Codes

| Error Code             | Description                       | Recovery Strategy                    |
| ---------------------- | --------------------------------- | ------------------------------------ |
| `SLIPPAGE`             | Price movement exceeded tolerance | Retry with higher slippage tolerance |
| `INSUFFICIENT_BALANCE` | User doesn't have enough tokens   | Request user to add funds            |
| `NETWORK_ERROR`        | RPC or network issues             | Retry after a delay                  |
| `QUOTE_EXPIRED`        | Price quote is no longer valid    | Get a fresh quote                    |

### Error Handling Best Practices

```tsx
import { useAnyspendCreateOrder } from "@b3dotfun/sdk/anyspend";

const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
  onError: error => {
    switch (error.message) {
      case "SLIPPAGE":
        toast.error("Price moved unfavorably. Please try again.");
        break;
      case "INSUFFICIENT_BALANCE":
        toast.error("Insufficient balance. Please add funds to your wallet.");
        break;
      default:
        toast.error("Transaction failed. Please try again or contact support.");
    }

    // Log for debugging
    console.error("Order creation failed:", error);

    // Optional: Send to error tracking service
    // errorTracking.captureException(error);
  }
});
```

### Order Monitoring

```tsx
import { useAnyspendOrderAndTransactions, OrderStatus } from "@b3dotfun/sdk/anyspend";

function OrderTracker({ orderId }) {
  const { orderAndTransactions } = useAnyspendOrderAndTransactions(true, orderId);

  if (!orderAndTransactions) return <div>Loading...</div>;

  const { order, depositTxs, executeTx, refundTxs } = orderAndTransactions.data;

  const getStatusMessage = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ScanningDepositTransaction:
        return "Waiting for payment confirmation...";
      case OrderStatus.Relay:
        return "Processing your transaction...";
      case OrderStatus.Executed:
        return "Transaction completed successfully!";
      case OrderStatus.Failure:
        return "Transaction failed. You will be refunded automatically.";
      case OrderStatus.Refunded:
        return "Refund processed successfully.";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="order-status">
      <h3>Order Status: {order.status}</h3>
      <p>{getStatusMessage(order.status)}</p>

      {order.errorDetails && (
        <div className="error-details">
          <strong>Error:</strong> {order.errorDetails}
        </div>
      )}

      {executeTx && (
        <a href={`https://explorer.b3.fun/tx/${executeTx.txHash}`} target="_blank" rel="noopener noreferrer">
          View Transaction
        </a>
      )}
    </div>
  );
}
```

## 🌐 Platform Support

| Feature           | React Web | React Native |
| ----------------- | --------- | ------------ |
| Core AnySpend     | ✅        | ✅           |
| React Components  | ✅        | ✅           |
| Fiat Onramp       | ✅        | ❌           |
| NFT Components    | ✅        | ✅           |
| Service Functions | ✅        | ✅           |

## 🐛 Troubleshooting

### Common Issues

**Q: "Get rate error" appears when trying to swap**

```
A: This usually means:
1. Invalid token addresses
2. Unsupported token pair
3. Amount too small/large
4. Network connectivity issues

Check that both tokens are supported and try with a different amount.
```

**Q: Order stuck in "scanning_deposit_transaction" status**

```
A: This means AnySpend is waiting for your deposit transaction to be confirmed.
Check that:
1. You sent the correct amount
2. Transaction was confirmed on-chain
3. You sent to the correct address

Orders will auto-refund after 30 minutes if no deposit is detected.
```

**Q: React Native build issues**

```
A: Make sure you're importing from the correct entry point:

// ✅ Correct
import { anyspendService } from "@b3dotfun/sdk/anyspend";

// ❌ Incorrect for React Native
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Add to your app initialization
localStorage.setItem("debug", "anyspend:*");

// Or in React Native
import { anyspendService } from "@b3dotfun/sdk/anyspend";

// Service calls will now log detailed information
const quote = await anyspendService.getQuote(true, quoteRequest);
```

### Support Channels

- **Documentation**: [https://docs.b3.fun](https://docs.b3.fun)
- **GitHub Issues**: [https://github.com/b3-fun/b3/issues](https://github.com/b3-fun/b3/issues)
- **Discord**: [https://discord.gg/b3dotfun](https://discord.gg/b3dotfun)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `pnpm install`
4. **Run tests**: `pnpm test`
5. **Build the SDK**: `pnpm sdk:build`
6. **Test your changes** in the example apps
7. **Submit a pull request**

### Development Setup

```bash
# Clone the repo
git clone https://github.com/b3-fun/b3.git
cd b3

# Install dependencies
pnpm install

# Start development
pnpm dev

# Build the SDK
pnpm sdk:build
```
