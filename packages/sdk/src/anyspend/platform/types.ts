/**
 * TypeScript types for the AnySpend Platform API.
 */

// ============== Base Types ==============

export interface ListResponse<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  total_count: number;
  url: string;
}

export interface DeletedResponse {
  object: string;
  id: string;
  deleted: true;
}

export interface ActionResponse {
  object: "action";
  action: string;
  [key: string]: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============== Payment Links ==============

export interface PaymentLink {
  object: "payment_link";
  id: string;
  short_code: string;
  url?: string;
  name: string;
  description: string | null;
  amount: string | null;
  min_amount: string | null;
  max_amount: string | null;
  suggested_amount: string | null;
  token_address: string;
  chain_id: number;
  recipient_address: string;
  product_id: string | null;
  image_url: string | null;
  theme_color: string | null;
  button_text: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: number | null;
  is_active: boolean;
  form_schema: string | null;
  shipping_options: string | null;
  collect_shipping_address: boolean;
  return_url: string | null;
  return_label: string | null;
  branding: string | null;
  fee_on_top: boolean;
  items?: PaymentLinkItem[];
  created_at: number;
  updated_at: number;
}

export interface PaymentLinkItem {
  object: "payment_link_item";
  id: string;
  payment_link_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  amount: string;
  quantity: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface CreatePaymentLinkParams {
  name: string;
  token_address: string;
  chain_id: number;
  recipient_address: string;
  description?: string;
  amount?: string;
  min_amount?: string;
  max_amount?: string;
  suggested_amount?: string;
  product_id?: string;
  image_url?: string;
  theme_color?: string;
  button_text?: string;
  max_uses?: number;
  expires_at?: number;
  form_schema?: Record<string, unknown>;
  shipping_options?: Record<string, unknown>[];
  collect_shipping_address?: boolean;
  return_url?: string;
  return_label?: string;
  branding?: Record<string, unknown>;
  fee_on_top?: boolean;
  items?: CreatePaymentLinkItemParams[];
}

export interface CreatePaymentLinkItemParams {
  name: string;
  amount: string;
  description?: string;
  image_url?: string;
  quantity?: number;
  sort_order?: number;
  product_id?: string;
}

export interface UpdatePaymentLinkParams extends Partial<Omit<CreatePaymentLinkParams, "items">> {
  is_active?: boolean;
  items?: CreatePaymentLinkItemParams[];
}

export interface ListPaymentLinksParams extends PaginationParams {
  search?: string;
  active?: "true" | "false";
  sort?: "created_at" | "updated_at" | "name" | "current_uses";
  order?: "asc" | "desc";
}

export interface PaymentLinkStats {
  object: "payment_link_stats";
  payment_link_id: string;
  summary: {
    total_views: number;
    total_sessions: number;
    total_completions: number;
    lifetime_completions: number;
    view_to_session_rate: string;
    session_to_completion_rate: string;
    overall_conversion_rate: string;
  };
  daily: {
    views: { date: string; view_count: number; unique_visitors: number }[];
    sessions: { date: string; sessions: number; completions: number }[];
  };
  utm_breakdown: Record<string, unknown>[];
}

// ============== Products ==============

export interface Product {
  object: "product";
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  amount: string;
  token_address: string;
  chain_id: number;
  recipient_address: string | null;
  product_type: "one_time" | "subscription" | "variable";
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  form_schema: string | null;
  shipping_options: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateProductParams {
  name: string;
  amount: string;
  token_address: string;
  chain_id: number;
  description?: string;
  image_url?: string;
  recipient_address?: string;
  product_type?: "one_time" | "subscription" | "variable";
  metadata?: Record<string, unknown>;
  form_schema?: Record<string, unknown>;
  shipping_options?: Record<string, unknown>[];
}

export interface UpdateProductParams extends Partial<CreateProductParams> {
  is_active?: boolean;
}

// ============== Customers ==============

export interface Customer {
  object: "customer";
  id: string;
  wallet_address: string;
  name: string | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
  total_paid: string | null;
  transaction_count: number;
  first_payment_at: number | null;
  last_payment_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface CreateCustomerParams {
  wallet_address: string;
  name?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCustomerParams {
  name?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

// ============== Transactions ==============

export interface Transaction {
  object: "transaction";
  id: string;
  tx_hash: string;
  chain_id: number;
  from_address: string;
  to_address: string;
  token_address: string;
  amount: string;
  amount_usd: string | null;
  status: "pending" | "confirming" | "completed" | "failed";
  payment_link_id: string | null;
  customer_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface TransactionStats {
  object: "transaction_stats";
  totalTransactions: number;
  completedTransactions: number;
  totalVolumeUsd: string;
  last24h: { transactions: number; volumeUsd: string };
  statusBreakdown: Record<string, number>;
}

export interface ListTransactionsParams extends PaginationParams {
  status?: string;
  customer_id?: string;
  payment_link_id?: string;
  from?: number;
  to?: number;
}

// ============== Checkout Sessions ==============

export interface CheckoutSession {
  object: "checkout_session";
  id: string;
  url: string | null;
  status: "open" | "processing" | "completed" | "expired" | "failed";
  payment_link_id: string | null;
  product_id: string | null;
  amount: string | null;
  token_address: string;
  chain_id: number;
  recipient_address: string;
  success_url: string | null;
  cancel_url: string | null;
  client_reference_id: string | null;
  metadata: string | null;
  customer_email: string | null;
  customer_name: string | null;
  tx_hash: string | null;
  completed_at: number | null;
  expires_at: number;
  created_at: number;
  updated_at: number;
}

export interface CreateCheckoutSessionParams {
  payment_link_id?: string;
  token_address?: string;
  chain_id?: number;
  recipient_address?: string;
  amount?: string;
  product_id?: string;
  success_url?: string;
  cancel_url?: string;
  client_reference_id?: string;
  metadata?: Record<string, unknown>;
  customer_email?: string;
  customer_name?: string;
  expires_in?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// ============== Webhooks ==============

export interface Webhook {
  object: "webhook";
  id: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
  success_count: number;
  failure_count: number;
  last_triggered_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface CreateWebhookParams {
  url: string;
  events: string[];
}

export interface UpdateWebhookParams {
  url?: string;
  events?: string[];
  is_active?: boolean;
}

// ============== Discount Codes ==============

export interface DiscountCode {
  object: "discount_code";
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: string;
  payment_link_id: string | null;
  max_uses: number | null;
  current_uses: number;
  min_order_amount: string | null;
  expires_at: number | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface CreateDiscountCodeParams {
  code: string;
  type: "percentage" | "fixed";
  value: string;
  payment_link_id?: string;
  max_uses?: number;
  min_order_amount?: string;
  expires_at?: number;
}

export interface BatchCreateDiscountCodesParams {
  codes: string[];
  type: "percentage" | "fixed";
  value: string;
  payment_link_id?: string;
  max_uses?: number;
  min_order_amount?: string;
  expires_at?: number;
}

// ============== Notifications ==============

export interface NotificationSettings {
  object: "notification_settings";
  id: string;
  email_enabled: boolean;
  email_address: string | null;
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  enabled_events: string[];
}

export interface UpdateNotificationSettingsParams {
  email_enabled?: boolean;
  email_address?: string;
  telegram_enabled?: boolean;
  enabled_events?: string[];
}

// ============== Widgets ==============

export interface WidgetConfig {
  object: "widget_config";
  id: string;
  short_code: string;
  name: string;
  description: string | null;
  widget_type: string;
  config: string;
  theme: string;
  is_active: boolean;
  current_views: number;
  created_at: number;
  updated_at: number;
}

export interface CreateWidgetParams {
  name: string;
  widget_type: "swap" | "checkout" | "nft" | "deposit";
  config: Record<string, unknown>;
  description?: string;
  theme?: Record<string, unknown>;
}

// ============== Organization ==============

export interface Organization {
  object: "organization";
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  default_recipient_address: string | null;
  default_chain_id: number | null;
  default_token_address: string | null;
}

// ============== Analytics ==============

export interface AnalyticsOverview {
  object: "analytics_overview";
  period: string;
  revenue: {
    period_usd: string;
    period_transactions: number;
    all_time_usd: string;
    all_time_transactions: number;
  };
  customers: { total: number; new_in_period: number };
  payment_links: { total: number; active: number };
  conversion_rate: string;
  daily: { date: string; transactions: number; revenue_usd: number }[];
  top_payment_links: Record<string, unknown>[];
  top_tokens: Record<string, unknown>[];
  top_chains: Record<string, unknown>[];
}

// ============== Events ==============

export interface ApiEvent {
  object: "event";
  id: string;
  event_type: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  request_method: string;
  request_path: string;
  status_code: number;
  created_at: number;
}

// ============== Quick Pay ==============

export interface QuickPayParams {
  recipient_address: string;
  amount?: string;
  token_address?: string;
  chain_id?: number;
  name?: string;
  description?: string;
  expires_in?: number;
}
