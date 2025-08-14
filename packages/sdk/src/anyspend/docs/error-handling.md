# Error Handling & Troubleshooting

Comprehensive guide to handling errors gracefully and debugging common issues with AnySpend.

## 📊 Order Status Lifecycle

Understanding order states is crucial for proper error handling and user experience.

### Order Status Types

```typescript
enum OrderStatus {
  // Initial States
  SCANNING_DEPOSIT_TRANSACTION = "scanning_deposit_transaction",
  WAITING_STRIPE_PAYMENT = "waiting_stripe_payment",
  OBTAIN_TOKEN = "obtain_token",

  // Processing States
  SENDING_TOKEN_FROM_VAULT = "sending_token_from_vault",
  RELAY = "relay",

  // Success States
  EXECUTED = "executed",

  // Failure States
  OBTAIN_FAILED = "obtain_failed",
  EXPIRED = "expired",
  REFUNDING = "refunding",
  REFUNDED = "refunded",
  FAILURE = "failure",
}
```

### Status Descriptions

| Status | Description | User Action Required |
|--------|-------------|---------------------|
| `scanning_deposit_transaction` | Waiting for payment confirmation | None - wait for blockchain confirmation |
| `waiting_stripe_payment` | Processing credit card payment | May need to complete 3D Secure |
| `obtain_token` | Getting source tokens from vault | None - automatic process |
| `sending_token_from_vault` | Sending tokens for swap | None - automatic process |
| `relay` | Cross-chain transaction in progress | None - wait for completion |
| `executed` | Transaction completed successfully | None - success! |
| `obtain_failed` | Failed to obtain source tokens | Check payment method/balance |
| `expired` | Order expired before completion | Create new order |
| `refunding` | Automatic refund in progress | None - wait for refund |
| `refunded` | Refund completed | Check wallet for refunded tokens |
| `failure` | Transaction failed | Review error details, retry |

## ⚠️ Common Error Codes

### Payment Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `INSUFFICIENT_BALANCE` | User doesn't have enough tokens | Request user to add funds |
| `INVALID_TOKEN_ADDRESS` | Token contract not supported | Verify token is supported on target chain |
| `MINIMUM_AMOUNT_NOT_MET` | Amount below minimum threshold | Increase transaction amount |
| `MAXIMUM_AMOUNT_EXCEEDED` | Amount above maximum limit | Reduce transaction amount or split |

### Network Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `SLIPPAGE` | Price moved beyond tolerance | Retry with higher slippage or wait |
| `NETWORK_ERROR` | RPC or connectivity issues | Retry after delay |
| `QUOTE_EXPIRED` | Price quote no longer valid | Get fresh quote |
| `CHAIN_NOT_SUPPORTED` | Blockchain not supported | Use supported chain |

### Contract Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `CONTRACT_CALL_FAILED` | Smart contract execution failed | Check contract parameters |
| `INSUFFICIENT_GAS` | Gas limit too low | Increase gas limit |
| `NONCE_TOO_LOW` | Transaction nonce issue | Wait and retry |
| `TRANSACTION_REVERTED` | Contract reverted transaction | Check contract state and parameters |

## 🛠️ Error Handling Patterns

### Component-Level Error Handling

```tsx
import { useAnyspendCreateOrder } from "@b3dotfun/sdk/anyspend";

function PaymentComponent() {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { createOrder, isCreatingOrder } = useAnyspendCreateOrder({
    onError: (error) => {
      console.error("Payment failed:", error);

      // Handle specific errors
      switch (error.message) {
        case "INSUFFICIENT_BALANCE":
          setError("Insufficient balance. Please add funds to your wallet.");
          break;

        case "SLIPPAGE":
          if (retryCount < 3) {
            setError("Price moved unfavorably. Retrying...");
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              retryPayment();
            }, 2000);
          } else {
            setError("Price too volatile. Please try again later.");
          }
          break;

        case "NETWORK_ERROR":
          setError("Network issue. Please check your connection and try again.");
          break;

        case "QUOTE_EXPIRED":
          setError("Price quote expired. Getting fresh quote...");
          refreshQuote();
          break;

        default:
          setError("Payment failed. Please try again or contact support.");
      }

      // Track errors for monitoring
      analytics.track("payment_error", {
        error: error.message,
        retryCount,
        timestamp: new Date().toISOString(),
      });
    },

    onSuccess: () => {
      setError(null);
      setRetryCount(0);
    },
  });

  return (
    <div className="payment-component">
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isCreatingOrder}
      >
        {isCreatingOrder ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}
```

### Order Status Monitoring

```tsx
import { useAnyspendOrderAndTransactions } from "@b3dotfun/sdk/anyspend";

function OrderStatusMonitor({ orderId }: { orderId: string }) {
  const { orderAndTransactions, getOrderAndTransactionsError } =
    useAnyspendOrderAndTransactions(orderId);

  if (getOrderAndTransactionsError) {
    return (
      <div className="error-state">
        <h3>Unable to load order status</h3>
        <p>Please check your connection and try again.</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!orderAndTransactions) {
    return <div>Loading order status...</div>;
  }

  const { order, depositTxs, executeTx, refundTxs } = orderAndTransactions.data;

  const renderStatusMessage = () => {
    switch (order.status) {
      case "scanning_deposit_transaction":
        return (
          <div className="status-pending">
            <div className="spinner" />
            <div>
              <h3>⏳ Waiting for payment confirmation</h3>
              <p>This usually takes 1-2 minutes. Please don't close this window.</p>
              {depositTxs.length > 0 && (
                <a
                  href={getExplorerUrl(depositTxs[0].txHash, depositTxs[0].chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View payment transaction
                </a>
              )}
            </div>
          </div>
        );

      case "relay":
        return (
          <div className="status-processing">
            <div className="spinner" />
            <div>
              <h3>🔄 Processing cross-chain transaction</h3>
              <p>Your payment is being processed. This may take a few minutes.</p>
            </div>
          </div>
        );

      case "executed":
        return (
          <div className="status-success">
            <div className="success-icon">✅</div>
            <div>
              <h3>Transaction completed successfully!</h3>
              <p>Your order has been processed.</p>
              {executeTx && (
                <a
                  href={getExplorerUrl(executeTx.txHash, executeTx.chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View transaction
                </a>
              )}
            </div>
          </div>
        );

      case "failure":
      case "obtain_failed":
        return (
          <div className="status-error">
            <div className="error-icon">❌</div>
            <div>
              <h3>Transaction failed</h3>
              <p>{order.errorDetails || "An error occurred while processing your order."}</p>
              <div className="error-actions">
                <button onClick={() => createNewOrder()}>
                  Try Again
                </button>
                <button onClick={() => contactSupport(orderId)}>
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        );

      case "refunded":
        return (
          <div className="status-refunded">
            <div className="refund-icon">↩️</div>
            <div>
              <h3>Refund processed</h3>
              <p>Your payment has been refunded automatically.</p>
              {refundTxs.length > 0 && (
                <a
                  href={getExplorerUrl(refundTxs[0].txHash, refundTxs[0].chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View refund transaction
                </a>
              )}
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="status-expired">
            <div className="expired-icon">⏰</div>
            <div>
              <h3>Order expired</h3>
              <p>This order expired before payment was received.</p>
              <button onClick={() => createNewOrder()}>
                Create New Order
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="status-unknown">
            <div className="spinner" />
            <div>
              <h3>Processing...</h3>
              <p>Order status: {order.status}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="order-status-monitor">
      <div className="order-header">
        <h2>Order #{orderId.slice(0, 8)}</h2>
        <div className="order-meta">
          <span>Created: {new Date(order.createdAt).toLocaleString()}</span>
          <span>Status: {order.status}</span>
        </div>
      </div>

      {renderStatusMessage()}

      {/* Debug information in development */}
      {process.env.NODE_ENV === "development" && (
        <details className="debug-info">
          <summary>Debug Information</summary>
          <pre>{JSON.stringify(order, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
```

### Global Error Boundary

```tsx
import React, { Component, ErrorInfo } from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AnySpendErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AnySpend Error Boundary caught an error:", error, errorInfo);

    // Report to error tracking service
    if (typeof window !== "undefined") {
      // Example: Sentry.captureException(error, { contexts: { errorInfo } });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>An unexpected error occurred in the payment component.</p>
      <details className="error-details">
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <div className="error-actions">
        <button onClick={resetError}>Try Again</button>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    </div>
  );
}

// Usage
function App() {
  return (
    <AnySpendErrorBoundary>
      <AnySpendProvider>
        {/* Your app components */}
      </AnySpendProvider>
    </AnySpendErrorBoundary>
  );
}
```

## 🐛 Troubleshooting Common Issues

### Issue: "Get rate error" when trying to swap

**Symptoms:**
- Quote request fails
- Unable to get pricing information
- Network requests timeout

**Solutions:**

```tsx
function DiagnoseQuoteIssue() {
  const [quoteRequest, setQuoteRequest] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");

  const diagnoseIssue = async () => {
    try {
      // Check if tokens are valid
      const srcTokenValid = await validateToken(quoteRequest.srcTokenAddress, quoteRequest.srcChain);
      const dstTokenValid = await validateToken(quoteRequest.dstTokenAddress, quoteRequest.dstChain);

      if (!srcTokenValid) {
        setDiagnosis("Source token address is invalid or not supported");
        return;
      }

      if (!dstTokenValid) {
        setDiagnosis("Destination token address is invalid or not supported");
        return;
      }

      // Check if amount is within limits
      const amount = parseFloat(quoteRequest.amount);
      if (amount < MIN_SWAP_AMOUNT) {
        setDiagnosis(`Amount too small. Minimum: ${MIN_SWAP_AMOUNT}`);
        return;
      }

      if (amount > MAX_SWAP_AMOUNT) {
        setDiagnosis(`Amount too large. Maximum: ${MAX_SWAP_AMOUNT}`);
        return;
      }

      // Check if chain pair is supported
      const chainPairSupported = await checkChainPairSupport(
        quoteRequest.srcChain,
        quoteRequest.dstChain
      );

      if (!chainPairSupported) {
        setDiagnosis("This chain pair is not currently supported");
        return;
      }

      setDiagnosis("All checks passed. Try refreshing the quote.");

    } catch (error) {
      setDiagnosis(`Network error: ${error.message}`);
    }
  };

  return (
    <div className="quote-diagnostics">
      <button onClick={diagnoseIssue}>Diagnose Quote Issue</button>
      {diagnosis && <p>{diagnosis}</p>}
    </div>
  );
}
```

### Issue: Order stuck in "scanning_deposit_transaction"

**Symptoms:**
- Order remains in pending state for over 10 minutes
- Payment transaction confirmed on blockchain
- No progress in AnySpend system

**Solutions:**

```tsx
function DepositDiagnostics({ orderId }: { orderId: string }) {
  const [depositDiag, setDepositDiag] = useState(null);

  const diagnoseDespositIssue = async () => {
    try {
      const order = await anyspendService.getOrder(orderId);

      if (!order.depositAddress) {
        setDepositDiag({
          issue: "No deposit address generated",
          solution: "Contact support with order ID"
        });
        return;
      }

      // Check if payment was sent to correct address
      const expectedAddress = order.depositAddress;
      const userTxs = await getTransactionsToAddress(expectedAddress);

      if (userTxs.length === 0) {
        setDepositDiag({
          issue: "No payment received at deposit address",
          solution: "Ensure you sent payment to: " + expectedAddress
        });
        return;
      }

      // Check if amount matches
      const expectedAmount = order.srcAmount;
      const receivedAmount = userTxs[0].amount;

      if (receivedAmount !== expectedAmount) {
        setDepositDiag({
          issue: `Amount mismatch. Expected: ${expectedAmount}, Received: ${receivedAmount}`,
          solution: "Send the exact amount specified"
        });
        return;
      }

      // Check transaction confirmations
      const confirmations = await getTransactionConfirmations(userTxs[0].hash);
      const requiredConfirmations = getRequiredConfirmations(order.srcChain);

      if (confirmations < requiredConfirmations) {
        setDepositDiag({
          issue: `Waiting for confirmations: ${confirmations}/${requiredConfirmations}`,
          solution: "Wait for more blockchain confirmations"
        });
        return;
      }

      setDepositDiag({
        issue: "Payment detected but not processed",
        solution: "This may be a system delay. Contact support if it persists."
      });

    } catch (error) {
      setDepositDiag({
        issue: "Unable to diagnose",
        solution: "Check your network connection and try again"
      });
    }
  };

  return (
    <div className="deposit-diagnostics">
      <button onClick={diagnoseDespositIssue}>
        Diagnose Deposit Issue
      </button>

      {depositDiag && (
        <div className="diagnosis-result">
          <h4>Issue: {depositDiag.issue}</h4>
          <p>Solution: {depositDiag.solution}</p>
        </div>
      )}
    </div>
  );
}
```

### Issue: React Native Build Problems

**Symptoms:**
- Metro bundler errors
- Module resolution failures
- Platform-specific component issues

**Solutions:**

1. **Correct Import Paths:**
```tsx
// ✅ Correct for React Native
import { anyspendService } from "@b3dotfun/sdk/anyspend";
import { useAnyspendQuote } from "@b3dotfun/sdk/anyspend";

// ❌ Incorrect for React Native (web-only components)
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";
```

2. **Metro Configuration:**
```javascript
// metro.config.js
module.exports = {
  resolver: {
    alias: {
      '@b3dotfun/sdk': require.resolve('@b3dotfun/sdk/index.native.js'),
    },
  },
};
```

3. **Platform-Specific Code:**
```tsx
import { Platform } from "react-native";

function PaymentComponent() {
  if (Platform.OS === "web") {
    // Use web components
    const { AnySpend } = require("@b3dotfun/sdk/anyspend/react");
    return <AnySpend {...props} />;
  } else {
    // Use service layer for native
    return <CustomNativePaymentFlow />;
  }
}
```

## 🔧 Debug Mode

Enable comprehensive logging for troubleshooting:

```typescript
// Browser
localStorage.setItem("debug", "anyspend:*");

// Node.js/React Native
process.env.DEBUG = "anyspend:*";

// Or programmatically
import { anyspendService } from "@b3dotfun/sdk/anyspend";

// Enable debug logging
anyspendService.setDebugMode(true);
```

### Debug Information Collection

```tsx
function DebugInfo({ orderId }: { orderId: string }) {
  const [debugData, setDebugData] = useState(null);

  const collectDebugInfo = async () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      orderId,

      // Network info
      connection: (navigator as any).connection,

      // Order data
      order: await anyspendService.getOrder(orderId),

      // Browser storage
      localStorage: { ...localStorage },

      // Console errors
      recentErrors: getRecentConsoleErrors(),

      // SDK version
      sdkVersion: process.env.REACT_APP_SDK_VERSION,
    };

    setDebugData(debugInfo);
  };

  const copyDebugInfo = () => {
    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    toast.success("Debug info copied to clipboard");
  };

  return (
    <div className="debug-info">
      <button onClick={collectDebugInfo}>
        Collect Debug Info
      </button>

      {debugData && (
        <div>
          <button onClick={copyDebugInfo}>
            Copy to Clipboard
          </button>
          <pre className="debug-output">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

## 📞 Support Channels

When you need additional help:

- **Documentation**: [View latest docs](../README.md)
- **GitHub Issues**: [Report bugs](https://github.com/b3-fun/b3/issues)
- **Discord**: [Join community](https://discord.gg/b3dotfun)
- **Email Support**: Include debug information and order IDs

### Creating Effective Bug Reports

```typescript
interface BugReport {
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: {
    sdkVersion: string;
    browser: string;
    platform: string;
    networkType: "mainnet" | "testnet";
  };
  orderId?: string;
  transactionHash?: string;
  errorMessage?: string;
  debugInfo?: object;
}
```

## Next Steps

- [View Installation Guide →](./installation.md)
- [Explore Components →](./components.md)
- [See Examples →](./examples.md)
