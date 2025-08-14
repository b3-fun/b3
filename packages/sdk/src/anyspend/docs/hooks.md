# Hooks API Reference

AnySpend provides a comprehensive set of React hooks for building custom payment flows and managing order lifecycles.

## Core Hooks

### `useAnyspendQuote`

Get real-time pricing information for token swaps and cross-chain transactions.

```tsx
import { useAnyspendQuote } from "@b3dotfun/sdk/anyspend";

const {
  anyspendQuote,
  isLoadingAnyspendQuote,
  getAnyspendQuoteError,
  refetchAnyspendQuote
} = useAnyspendQuote(quoteRequest);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `quoteRequest` | `QuoteRequest` | Quote configuration object |

#### QuoteRequest Interface

```typescript
interface QuoteRequest {
  srcChain: number;              // Source chain ID
  dstChain: number;              // Destination chain ID
  srcTokenAddress: string;       // Source token contract address
  dstTokenAddress: string;       // Destination token contract address
  type: "swap" | "custom";       // Order type
  tradeType: "EXACT_INPUT" | "EXACT_OUTPUT";
  amount: string;                // Amount in smallest unit (wei)
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `anyspendQuote` | `QuoteResponse \| null` | Quote data with pricing and fees |
| `isLoadingAnyspendQuote` | `boolean` | Loading state |
| `getAnyspendQuoteError` | `Error \| null` | Error if quote failed |
| `refetchAnyspendQuote` | `() => void` | Manually refresh quote |

#### Usage Example

```tsx
function SwapQuote() {
  const quoteRequest = {
    srcChain: 1,           // Ethereum
    dstChain: 8333,        // B3
    srcTokenAddress: "0xA0b86a33E6Fb6Dd9a9B3d8B5FEb2b3C8e7D9Ff1E", // USDC
    dstTokenAddress: "0x0000000000000000000000000000000000000000", // ETH
    type: "swap",
    tradeType: "EXACT_INPUT",
    amount: "1000000", // 1 USDC (6 decimals)
  };

  const { anyspendQuote, isLoadingAnyspendQuote, getAnyspendQuoteError } =
    useAnyspendQuote(quoteRequest);

  if (isLoadingAnyspendQuote) return <div>Getting best price...</div>;
  if (getAnyspendQuoteError) return <div>Failed to get quote</div>;

  return (
    <div>
      <p>You'll receive: {anyspendQuote?.expectedOutput} ETH</p>
      <p>Network fee: ${anyspendQuote?.networkFeeUsd}</p>
      <p>Service fee: ${anyspendQuote?.serviceFeeUsd}</p>
      <p>Total cost: ${anyspendQuote?.totalUsdCost}</p>
    </div>
  );
}
```

---

### `useAnyspendCreateOrder`

Create and execute AnySpend orders with comprehensive error handling.

```tsx
import { useAnyspendCreateOrder } from "@b3dotfun/sdk/anyspend";

const {
  createOrder,
  isCreatingOrder,
  createOrderError
} = useAnyspendCreateOrder(options);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `CreateOrderOptions` | Configuration object |

#### CreateOrderOptions Interface

```typescript
interface CreateOrderOptions {
  onSuccess?: (data: OrderResponse) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `createOrder` | `(request: CreateOrderRequest) => void` | Function to create order |
| `isCreatingOrder` | `boolean` | Loading state |
| `createOrderError` | `Error \| null` | Error if order creation failed |

#### Usage Example

```tsx
function PaymentForm() {
  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onSuccess: (data) => {
      console.log("Order created:", data.data.id);
      // Redirect to payment or show success
      router.push(`/payment/${data.data.id}`);
    },
    onError: (error) => {
      console.error("Order failed:", error.message);
      toast.error("Payment failed. Please try again.");
    },
  });

  const handlePayment = () => {
    createOrder({
      recipientAddress: userWalletAddress,
      orderType: "swap",
      srcChain: 1,
      dstChain: 8333,
      srcToken: {
        chainId: 1,
        address: "0xA0b86a33E6Fb6Dd9a9B3d8B5FEb2b3C8e7D9Ff1E",
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
      },
      dstToken: {
        chainId: 8333,
        address: "0x0000000000000000000000000000000000000000",
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      srcAmount: "1000000", // 1 USDC
      expectedDstAmount: "500000000000000000", // ~0.5 ETH
      creatorAddress: userWalletAddress,
    });
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isCreatingOrder}
    >
      {isCreatingOrder ? "Processing..." : "Pay with Crypto"}
    </button>
  );
}
```

---

### `useAnyspendOrderAndTransactions`

Monitor order status and track associated blockchain transactions in real-time.

```tsx
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend";

const {
  orderAndTransactions,
  isLoadingOrderAndTransactions,
  getOrderAndTransactionsError
} = useAnyspendOrderAndTransactions(orderId);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | `string` | Order ID to track |

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `orderAndTransactions` | `OrderWithTransactions \| null` | Complete order data |
| `isLoadingOrderAndTransactions` | `boolean` | Loading state |
| `getOrderAndTransactionsError` | `Error \| null` | Error if fetch failed |

#### OrderWithTransactions Interface

```typescript
interface OrderWithTransactions {
  data: {
    order: Order;               // Order details and status
    depositTxs: Transaction[];  // User deposit transactions
    relayTx?: Transaction;      // Cross-chain relay transaction
    executeTx?: Transaction;    // Final execution transaction
    refundTxs: Transaction[];   // Refund transactions (if any)
  };
}
```

#### Usage Example

```tsx
function OrderTracker({ orderId }: { orderId: string }) {
  const { orderAndTransactions, isLoadingOrderAndTransactions } =
    useAnyspendOrderAndTransactions(orderId);

  if (isLoadingOrderAndTransactions) {
    return <div>Loading order status...</div>;
  }

  if (!orderAndTransactions) {
    return <div>Order not found</div>;
  }

  const { order, depositTxs, executeTx, refundTxs } = orderAndTransactions.data;

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "scanning_deposit_transaction":
        return "⏳ Waiting for payment confirmation...";
      case "relay":
        return "🔄 Processing cross-chain transaction...";
      case "executed":
        return "✅ Transaction completed successfully!";
      case "refunded":
        return "↩️ Refund processed";
      default:
        return "🔄 Processing...";
    }
  };

  return (
    <div className="order-status">
      <h2>Order #{orderId.slice(0, 8)}</h2>
      <p>{getStatusMessage(order.status)}</p>

      {depositTxs.length > 0 && (
        <div>
          <h3>Payment Transaction</h3>
          <a
            href={`https://etherscan.io/tx/${depositTxs[0].txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Etherscan
          </a>
        </div>
      )}

      {executeTx && (
        <div>
          <h3>Execution Transaction</h3>
          <a
            href={`https://explorer.b3.fun/tx/${executeTx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on B3 Explorer
          </a>
        </div>
      )}

      {order.errorDetails && (
        <div className="error">
          <strong>Error:</strong> {order.errorDetails}
        </div>
      )}
    </div>
  );
}
```

---

### `useAnyspendOrderHistory`

Retrieve paginated order history for a user address.

```tsx
import { useAnyspendOrderHistory } from "@b3dotfun/sdk/anyspend";

const {
  orderHistory,
  isLoadingOrderHistory,
  getOrderHistoryError
} = useAnyspendOrderHistory(creatorAddress, limit, offset);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `creatorAddress` | `string` | User wallet address |
| `limit` | `number` | Number of orders to fetch (max 100) |
| `offset` | `number` | Pagination offset |

#### Usage Example

```tsx
function OrderHistory({ userAddress }: { userAddress: string }) {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { orderHistory, isLoadingOrderHistory } = useAnyspendOrderHistory(
    userAddress,
    pageSize,
    page * pageSize
  );

  if (isLoadingOrderHistory) {
    return <div>Loading order history...</div>;
  }

  return (
    <div>
      <h2>Your Orders</h2>
      {orderHistory?.data.map((order) => (
        <div key={order.id} className="order-item">
          <p>Type: {order.type}</p>
          <p>Status: {order.status}</p>
          <p>Amount: {order.srcAmount} {order.srcToken.symbol}</p>
          <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      ))}

      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 0}
      >
        Previous
      </button>
      <button
        onClick={() => setPage(page + 1)}
        disabled={!orderHistory?.data || orderHistory.data.length < pageSize}
      >
        Next
      </button>
    </div>
  );
}
```

## Additional Hooks

### `useAnyspendTokens`

Get available tokens for a specific chain.

```tsx
const { tokens, isLoadingTokens } = useAnyspendTokens(1, "USDC");
```

### `useCoinbaseOnrampOptions`

Get Coinbase onramp configuration for fiat payments.

```tsx
const { coinbaseOptions, isLoadingCoinbaseOptions } = useCoinbaseOnrampOptions();
```

### `useStripeClientSecret`

Get Stripe payment intent for credit card payments.

```tsx
const { clientSecret, isLoadingClientSecret } = useStripeClientSecret(orderData);
```

## Hook Patterns

### Error Handling Pattern

```tsx
function PaymentComponent() {
  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onError: (error) => {
      // Log error for debugging
      console.error("Payment failed:", error);

      // Show user-friendly message
      switch (error.message) {
        case "INSUFFICIENT_BALANCE":
          toast.error("Insufficient balance. Please add funds.");
          break;
        case "SLIPPAGE":
          toast.error("Price moved unfavorably. Please try again.");
          break;
        default:
          toast.error("Payment failed. Please try again.");
      }
    },
  });

  // Component implementation...
}
```

### Loading State Pattern

```tsx
function SwapInterface() {
  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote(quoteRequest);
  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder();

  const isLoading = isLoadingAnyspendQuote || isCreatingOrder;

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {/* Rest of component */}
    </div>
  );
}
```

### Real-time Updates Pattern

```tsx
function OrderStatus({ orderId }: { orderId: string }) {
  const { orderAndTransactions } = useAnyspendOrderAndTransactions(orderId);

  // Auto-refresh every 5 seconds for pending orders
  useEffect(() => {
    if (orderAndTransactions?.data.order.status === "relay") {
      const interval = setInterval(() => {
        // Refetch is handled automatically by the hook
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [orderAndTransactions?.data.order.status]);

  // Component implementation...
}
```

## Next Steps

- [See Examples →](./examples.md)
- [Error Handling →](./error-handling.md)
- [Components Reference →](./components.md)
