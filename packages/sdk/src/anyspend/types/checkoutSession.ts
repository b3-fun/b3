// ---- Request types ----

export interface CreateCheckoutSessionRequest {
  success_url?: string; // "https://merchant.com/ok?s={SESSION_ID}"
  cancel_url?: string;
  metadata?: Record<string, string>;
  client_reference_id?: string;
  amount: string; // token minor units
  currency?: string; // default "USDC"
  recipient_address: string;
  src_chain: number;
  dst_chain: number;
  src_token_address: string;
  dst_token_address: string;
  onramp?: {
    vendor: "coinbase" | "stripe-web2" | "none";
    payment_method: string;
    country: string;
  };
  expires_in?: number; // seconds, default 1800
}

// ---- Response types ----

export interface CheckoutSession {
  id: string;
  status: "open" | "processing" | "complete" | "expired";
  success_url: string | null;
  cancel_url: string | null;
  metadata: Record<string, string>;
  amount: string;
  currency: string;
  checkout_url: string | null; // onramp URL — redirect user here
  order_id: string | null;
  order_status: string | null;
  settlement: {
    tx_hash: string;
    actual_amount: string;
  } | null;
  expires_at: string;
  created_at: string;
}

export type CreateCheckoutSessionResponse = {
  success: boolean;
  message: string;
  data: CheckoutSession;
  statusCode: number;
};

export type GetCheckoutSessionResponse = CreateCheckoutSessionResponse;
