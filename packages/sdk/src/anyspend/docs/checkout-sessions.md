# Checkout Sessions

Stripe-like checkout sessions for AnySpend. Sessions are decoupled from orders — create a session first, then create an order when the user is ready to pay.

## Flow

```
1. Merchant creates session        POST /checkout-sessions
                                   <- { id, status: "open" }

2. User picks payment method       POST /orders { checkoutSessionId }
                                   <- { id, globalAddress, oneClickBuyUrl }

3. User pays                       Crypto: send to globalAddress
                                   Onramp: redirect to oneClickBuyUrl

4. Merchant polls for completion   GET /checkout-sessions/:id
                                   <- { status: "complete", order_id }
```

### Why Decoupled?

Session creation is instant (DB-only, no external calls). The order is created separately when the user commits to a payment method. This means:

- Payment method doesn't need to be known at session creation
- A hosted checkout page can let users choose how to pay
- Session creation never fails due to external API errors

## Session Status Lifecycle

```
open --> processing --> complete (verified)
  |
  └--> expired
```

| Status | When |
|--------|------|
| `open` | Created, waiting for order/payment |
| `processing` | Client reported payment, waiting for server-side verification |
| `complete` | Order verified on-chain by the anyspend-service callback |
| `expired` | TTL expired, payment failed, or manually expired |

## Server-Side Payment Verification

Checkout sessions use server-side verification to prevent spoofed completions. The client `/complete` endpoint only transitions a session to `processing` — it does **not** trigger side effects (webhooks, customer creation, discount usage, etc.).

The anyspend-service verifies the payment on-chain and sends a callback to the platform's internal endpoint, which finalizes the session to `complete` and runs all side effects. This ensures that webhooks and merchant integrations are only triggered by verified payments.

```
Client calls /complete  -->  session: "processing"
                                  |
anyspend-service verifies  -->  internal callback  -->  session: "complete" + side effects
on-chain (order.executed)
```

Verified sessions include `verified_at` and `verified_by` fields in the session object, providing an audit trail of server-verified completions.

**No SDK changes required** — the SDK already passes `checkoutSessionId` in `callbackMetadata` when creating orders, so the verification pipeline works automatically.

## API

### `POST /checkout-sessions` — Create Session

Creates a lightweight session. No order, no external API calls.

```json
{
  "success_url": "https://merchant.com/success?session_id={SESSION_ID}",
  "cancel_url": "https://merchant.com/cancel",
  "metadata": { "sku": "widget-1" },
  "client_reference_id": "merchant-order-456",
  "expires_in": 1800
}
```

All fields are optional. Payment config (amount, tokens, chains) lives on the order, not the session.

### `POST /orders` — Create Order with Session Linking

Pass `checkoutSessionId` in the standard order creation request to link the order to a session.

```json
{
  "recipientAddress": "0x...",
  "srcChain": 8453,
  "dstChain": 8453,
  "srcTokenAddress": "0x...",
  "dstTokenAddress": "0x...",
  "srcAmount": "1000000",
  "type": "swap",
  "payload": { "expectedDstAmount": "1000000" },
  "checkoutSessionId": "550e8400-..."
}
```

**Validation:**
- Session must exist (`400` if not found)
- Session must be `open` (`400` if expired/processing/complete)
- Session must not already have an order (`409 Conflict`)

### `GET /checkout-sessions/:id` — Retrieve Session

Returns current session state. Status is synced from the underlying order on each retrieval.

| Query Param | Description |
|-------------|-------------|
| `include=order` | Embed the full order object with transactions |

### `POST /checkout-sessions/:id/expire` — Manually Expire

Only works on sessions with status `open`.

## Redirect URL Templates

Use template variables in `success_url` and `cancel_url`:

| Variable | Replaced with |
|----------|--------------|
| `{SESSION_ID}` | The checkout session UUID |
| `{ORDER_ID}` | Same value (alias) |

If no template variable is present, `?sessionId=<uuid>` is appended automatically.

## SDK Integration

### Service Methods

```typescript
// Create a checkout session
const session = await anyspend.createCheckoutSession({
  success_url: "https://mysite.com/success/{SESSION_ID}",
  metadata: { sku: "widget-1" },
});

// Retrieve session status
const session = await anyspend.getCheckoutSession(sessionId);
```

### React Hooks

#### `useCreateCheckoutSession`

Mutation hook for creating sessions.

```tsx
import { useCreateCheckoutSession } from "@b3dotfun/sdk/anyspend";

const { mutate: createSession, data, isPending } = useCreateCheckoutSession();
```

#### `useCheckoutSession`

Query hook with auto-polling. Stops polling when status reaches `complete` or `expired`.

```tsx
import { useCheckoutSession } from "@b3dotfun/sdk/anyspend";

const { data: session, isLoading } = useCheckoutSession(sessionId);
```

### Component `checkoutSession` Prop

The `<AnySpend>`, `<AnySpendCustom>`, and `<AnySpendCustomExactIn>` components accept an optional `checkoutSession` prop:

```tsx
<AnySpend
  defaultActiveTab="fiat"
  destinationTokenAddress="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  destinationTokenChainId={8453}
  recipientAddress="0x..."
  checkoutSession={{
    success_url: "https://myshop.com/success?session={SESSION_ID}",
    cancel_url: "https://myshop.com/cancel",
    metadata: { sku: "widget-1" },
  }}
/>
```

When the `checkoutSession` prop is set, the component automatically creates a session before creating the order, and uses the session's `success_url` for redirects. Without the prop, existing flows are unchanged.

## Examples

### Crypto Payment

```typescript
// 1. Create session
const session = await fetch("/checkout-sessions", {
  method: "POST",
  body: JSON.stringify({
    success_url: "https://mysite.com/success/{SESSION_ID}",
    metadata: { sku: "widget-1" },
  }),
}).then(r => r.json());

// 2. Create order linked to session
const order = await fetch("/orders", {
  method: "POST",
  body: JSON.stringify({
    recipientAddress: "0x...",
    srcChain: 8453,
    dstChain: 8453,
    srcTokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    dstTokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    srcAmount: "1000000",
    type: "swap",
    payload: { expectedDstAmount: "1000000" },
    checkoutSessionId: session.data.id,
  }),
}).then(r => r.json());

// 3. User sends crypto to order.data.globalAddress

// 4. Poll session until complete
const poll = setInterval(async () => {
  const s = await fetch(`/checkout-sessions/${session.data.id}`).then(r => r.json());
  if (s.data.status === "complete") {
    clearInterval(poll);
    // redirect to success_url or show confirmation
  }
}, 3000);
```

### Onramp Payment (Coinbase/Stripe)

```typescript
// Steps 1-2 same as above, but include onramp config in order creation:
const order = await fetch("/orders", {
  method: "POST",
  body: JSON.stringify({
    // ... same order fields ...
    checkoutSessionId: session.data.id,
    onramp: {
      vendor: "coinbase",
      payment_method: "card",
      country: "US",
    },
  }),
}).then(r => r.json());

// Redirect user to vendor checkout page
window.location.href = order.data.oneClickBuyUrl;

// After vendor redirects back, poll GET /checkout-sessions/:id for completion
```
