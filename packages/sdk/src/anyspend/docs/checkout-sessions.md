# Checkout Sessions

Stripe-like checkout sessions for AnySpend. Merchants create a session, redirect users to a hosted payment page, and verify the result on a success page.

## Overview

Checkout sessions wrap the existing AnySpend order flow with merchant-controlled redirect URLs and metadata. The backend creates an order internally, so existing order polling and payment UIs continue to work.

```
Merchant backend
  → POST /checkout-sessions { success_url, cancel_url, metadata, amount, ... }
  ← { id, checkout_url, order_id, status }

User → checkout_url (Coinbase/Stripe hosted page)
User pays → redirected to success_url with {SESSION_ID} resolved

Merchant success page
  → GET /checkout-sessions/{sessionId}
  ← { status, metadata, order_status, settlement }
```

---

## Integration Options

### Option 1: Component Prop (Recommended)

Pass a `checkoutSession` prop to any AnySpend component. The component handles session creation, payment UI, and redirect automatically.

```tsx
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";

<AnySpend
  defaultActiveTab="fiat"
  destinationTokenAddress="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  destinationTokenChainId={8453}
  recipientAddress={userWalletAddress}
  checkoutSession={{
    success_url: "https://myshop.com/success?session={SESSION_ID}",
    cancel_url: "https://myshop.com/cancel",
    metadata: { sku: "widget-1", customer_id: "cust-123" },
  }}
  onSuccess={(txHash) => console.log("Payment completed!", txHash)}
/>
```

**Supported components:**
- `<AnySpend>` — Full payment UI with crypto + fiat tabs
- `<AnySpendCustom>` — Custom smart contract interactions
- `<AnySpendCustomExactIn>` — Exact input amount flows (via `useAnyspendFlow`)

When `checkoutSession` is set:
1. Fiat order creation calls `POST /checkout-sessions` instead of `POST /orders`
2. The backend creates an order internally and returns `order_id`
3. Existing order polling (`useAnyspendOrderAndTransactions`) kicks in
4. On completion, the user is redirected to the resolved `success_url`

Without `checkoutSession`, all existing flows remain unchanged.

#### `checkoutSession` Prop Interface

```typescript
interface CheckoutSessionConfig {
  success_url?: string;   // Redirect URL on success (supports {SESSION_ID} template)
  cancel_url?: string;    // Redirect URL on cancel
  metadata?: Record<string, string>;  // Merchant metadata, returned on GET
}
```

#### Template Variables

| Variable | Replaced with |
|----------|--------------|
| `{SESSION_ID}` | The checkout session UUID |
| `{ORDER_ID}` | Same value (alias) |

**Example:**
```
https://myshop.com/success?session={SESSION_ID}
  → https://myshop.com/success?session=550e8400-...
```

If no template variable is present, `?sessionId=<uuid>` is appended automatically by the backend.

---

### Option 2: Hooks (Custom UI)

Use the low-level hooks to build a fully custom checkout flow.

#### `useCreateCheckoutSession`

Create a checkout session via mutation.

```tsx
import { useCreateCheckoutSession } from "@b3dotfun/sdk/anyspend/react";

const { createSession, createSessionAsync, isCreating, session, error } =
  useCreateCheckoutSession({
    onSuccess: (session) => {
      // Redirect user to hosted payment page
      if (session.checkout_url) {
        window.location.href = session.checkout_url;
      }
    },
    onError: (error) => {
      console.error("Failed to create session:", error);
    },
  });
```

##### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.onSuccess` | `(session: CheckoutSession) => void` | Called with session data on success |
| `options.onError` | `(error: Error) => void` | Called on failure |

##### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `createSession` | `(params: CreateCheckoutSessionRequest) => void` | Trigger session creation |
| `createSessionAsync` | `(params: CreateCheckoutSessionRequest) => Promise` | Async version |
| `isCreating` | `boolean` | Loading state |
| `session` | `CheckoutSession \| null` | Created session data |
| `error` | `Error \| null` | Error if creation failed |

##### Usage Example

```tsx
function CustomCheckout() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { createSession, isCreating } = useCreateCheckoutSession({
    onSuccess: (session) => {
      setSessionId(session.id);
      if (session.checkout_url) {
        window.location.href = session.checkout_url;
      }
    },
  });

  return (
    <button
      onClick={() =>
        createSession({
          success_url: `${window.location.origin}/success?session={SESSION_ID}`,
          amount: "5000000", // 5 USDC
          recipient_address: "0x...",
          src_chain: 8453,
          dst_chain: 8453,
          src_token_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          dst_token_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          metadata: { product: "Premium Plan" },
        })
      }
      disabled={isCreating}
    >
      {isCreating ? "Creating..." : "Pay $5 USDC"}
    </button>
  );
}
```

---

#### `useCheckoutSession`

Poll a checkout session by ID. Automatically stops polling when status is `complete` or `expired`.

```tsx
import { useCheckoutSession } from "@b3dotfun/sdk/anyspend/react";

const { session, isLoading, isComplete, isExpired, error } =
  useCheckoutSession(sessionId);
```

##### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | `string \| null` | Session ID to poll (null disables) |
| `options.refetchInterval` | `number` | Polling interval in ms (default 3000) |
| `options.enabled` | `boolean` | Enable/disable polling |

##### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `session` | `CheckoutSession \| null` | Current session data |
| `isLoading` | `boolean` | Initial loading state |
| `isComplete` | `boolean` | Whether session status is "complete" |
| `isExpired` | `boolean` | Whether session status is "expired" |
| `error` | `Error \| null` | Error if fetch failed |

##### Usage Example — Success Page

```tsx
function SuccessPage() {
  const sessionId = new URLSearchParams(window.location.search).get("session");
  const { session, isComplete, isLoading } = useCheckoutSession(sessionId);

  if (isLoading) return <Spinner />;
  if (!session) return <div>Session not found</div>;

  return (
    <div>
      <h1>{isComplete ? "Payment complete!" : `Status: ${session.status}`}</h1>
      <p>Order: {session.order_id}</p>
      <p>Amount: {session.amount} {session.currency}</p>
      {session.settlement && <p>Tx: {session.settlement.tx_hash}</p>}
      <p>SKU: {session.metadata.sku}</p>
    </div>
  );
}
```

---

### Option 3: Server-Side Only

Merchants can use the REST API directly without SDK hooks:

1. **Backend** calls `POST /checkout-sessions` with API key
2. Gets `checkout_url` → redirects user
3. **Success page** calls `GET /checkout-sessions/:id` to verify

See [Backend API docs](https://github.com/b3-fun/b3-mono/blob/feat/checkout-sessions/services/anyspend-service/docs/CHECKOUT_SESSIONS.md) for full API reference.

---

## Service Methods

For advanced use cases, the service methods are available directly:

```typescript
import { anyspendService } from "@b3dotfun/sdk/anyspend";

// Create a checkout session
const response = await anyspendService.createCheckoutSession(
  {
    success_url: "https://myshop.com/success?session={SESSION_ID}",
    cancel_url: "https://myshop.com/cancel",
    amount: "1000000",
    recipient_address: "0x...",
    src_chain: 8453,
    dst_chain: 8453,
    src_token_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    dst_token_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    onramp: { vendor: "coinbase", payment_method: "CARD", country: "US" },
    metadata: { sku: "widget-1" },
  },
  { partnerId: "your-partner-id" },
);

// Retrieve a checkout session
const session = await anyspendService.getCheckoutSession("session-uuid");
```

---

## Types

All checkout session types are exported from the SDK:

```typescript
import type {
  CreateCheckoutSessionRequest,
  CheckoutSession,
  CreateCheckoutSessionResponse,
  GetCheckoutSessionResponse,
} from "@b3dotfun/sdk/anyspend";
```

### `CheckoutSession`

```typescript
interface CheckoutSession {
  id: string;
  status: "open" | "processing" | "complete" | "expired";
  success_url: string | null;
  cancel_url: string | null;
  metadata: Record<string, string>;
  amount: string;
  currency: string;
  checkout_url: string | null;
  order_id: string | null;
  order_status: string | null;
  settlement: {
    tx_hash: string;
    actual_amount: string;
  } | null;
  expires_at: string;
  created_at: string;
}
```

### Session Status Lifecycle

```
open ──► processing ──► complete
  │
  └──► expired (by time, manual, or order failure)
```

| Status | When |
|--------|------|
| `open` | Just created, waiting for payment |
| `processing` | Payment received, order executing |
| `complete` | Order executed successfully |
| `expired` | TTL expired, payment failed, or manually expired |

---

## Key Files

| File | Purpose |
|------|---------|
| `types/checkoutSession.ts` | TypeScript types for checkout session API |
| `services/anyspend.ts` | `createCheckoutSession` and `getCheckoutSession` service methods |
| `react/hooks/useCreateCheckoutSession.ts` | Mutation hook for creating sessions |
| `react/hooks/useCheckoutSession.ts` | Query hook with auto-polling |
| `react/hooks/useAnyspendCreateCheckoutSessionOrder.ts` | Bridge hook used by components internally |
| `react/components/AnySpend.tsx` | `checkoutSession` prop support |
| `react/components/AnySpendCustom.tsx` | `checkoutSession` prop support |
| `react/components/AnySpendCustomExactIn.tsx` | `checkoutSession` prop support |
| `react/components/common/OrderDetails.tsx` | Redirect URL handling for checkout sessions |

## Next Steps

- [Hooks Reference →](./hooks.md)
- [Components Reference →](./components.md)
- [Examples →](./examples.md)
