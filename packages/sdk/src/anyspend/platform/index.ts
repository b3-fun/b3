/**
 * AnySpend Platform API Client
 *
 * A headless TypeScript client for the AnySpend Platform REST API.
 * Works in any runtime with `fetch` (Node.js, browsers, Cloudflare Workers, Deno, Bun).
 *
 * @example
 * ```typescript
 * import { AnySpendPlatformClient } from '@b3dotfun/sdk/anyspend/platform';
 *
 * const platform = new AnySpendPlatformClient('asp_your_api_key_here');
 *
 * // Create a payment link
 * const link = await platform.paymentLinks.create({
 *   name: 'Summer Sale',
 *   amount: '10000000',
 *   token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
 *   chain_id: 8453,
 *   recipient_address: '0x...',
 * });
 *
 * // Quick pay (no API key needed)
 * const quickLink = await AnySpendPlatformClient.quickPay({
 *   recipient_address: '0x...',
 *   amount: '5000000',
 * });
 * ```
 */

import { HttpClient, StaticHttpClient, DEFAULT_BASE_URL, type ClientConfig } from "./client";
import { PaymentLinksResource } from "./resources/payment-links";
import { ProductsResource } from "./resources/products";
import { CustomersResource } from "./resources/customers";
import { TransactionsResource } from "./resources/transactions";
import { CheckoutSessionsResource } from "./resources/checkout-sessions";
import { WebhooksResource } from "./resources/webhooks";
import { DiscountCodesResource } from "./resources/discount-codes";
import { NotificationsResource } from "./resources/notifications";
import { WidgetsResource } from "./resources/widgets";
import { OrganizationResource } from "./resources/organization";
import { AnalyticsResource } from "./resources/analytics";
import { EventsResource } from "./resources/events";
import type { QuickPayParams, PaymentLink } from "./types";

export class AnySpendPlatformClient {
  private client: HttpClient;

  /** Payment Links - Create, manage, and track payment links */
  readonly paymentLinks: PaymentLinksResource;

  /** Products - Manage your product catalog */
  readonly products: ProductsResource;

  /** Customers - Manage customer records */
  readonly customers: CustomersResource;

  /** Transactions - View transaction history and stats */
  readonly transactions: TransactionsResource;

  /** Checkout Sessions - Server-side checkout management */
  readonly checkoutSessions: CheckoutSessionsResource;

  /** Webhooks - Configure webhook endpoints */
  readonly webhooks: WebhooksResource;

  /** Discount Codes - Create and validate discounts */
  readonly discountCodes: DiscountCodesResource;

  /** Notifications - Email and Telegram settings */
  readonly notifications: NotificationsResource;

  /** Widgets - Embeddable widget configurations */
  readonly widgets: WidgetsResource;

  /** Organization - Org settings and defaults */
  readonly organization: OrganizationResource;

  /** Analytics - Revenue and conversion analytics */
  readonly analytics: AnalyticsResource;

  /** Events - API audit trail */
  readonly events: EventsResource;

  /**
   * Create a new AnySpend Platform API client.
   *
   * @param apiKey - Your API key (starts with `asp_`)
   * @param config - Optional configuration
   */
  constructor(apiKey: string, config?: ClientConfig) {
    this.client = new HttpClient(apiKey, config);

    this.paymentLinks = new PaymentLinksResource(this.client);
    this.products = new ProductsResource(this.client);
    this.customers = new CustomersResource(this.client);
    this.transactions = new TransactionsResource(this.client);
    this.checkoutSessions = new CheckoutSessionsResource(this.client);
    this.webhooks = new WebhooksResource(this.client);
    this.discountCodes = new DiscountCodesResource(this.client);
    this.notifications = new NotificationsResource(this.client);
    this.widgets = new WidgetsResource(this.client);
    this.organization = new OrganizationResource(this.client);
    this.analytics = new AnalyticsResource(this.client);
    this.events = new EventsResource(this.client);
  }

  /**
   * Create a quick payment link without authentication.
   * Rate limited to 5 requests per minute per IP.
   *
   * @param params - Quick pay parameters
   * @param baseUrl - Optional API base URL (defaults to production)
   */
  static async quickPay(params: QuickPayParams, baseUrl: string = DEFAULT_BASE_URL): Promise<PaymentLink> {
    return StaticHttpClient.post<PaymentLink>(baseUrl, "/quick-pay", params as unknown as Record<string, unknown>);
  }
}

// Re-export types and errors
export type { ClientConfig } from "./client";
export {
  ApiError,
  AuthenticationError,
  PermissionError,
  RateLimitError,
  NotFoundError,
  IdempotencyError,
} from "./errors";
export type * from "./types";
