import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type {
  PaymentLink,
  PaymentLinkItem,
  PaymentLinkStats,
  CheckoutSession,
  ListResponse,
  DeletedResponse,
  CreatePaymentLinkParams,
  CreatePaymentLinkItemParams,
  UpdatePaymentLinkParams,
  ListPaymentLinksParams,
  PaginationParams,
} from "../types";

export class PaymentLinksResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListPaymentLinksParams): Promise<ListResponse<PaymentLink>> {
    return this.client.get<ListResponse<PaymentLink>>("/payment-links", params as any);
  }

  async *listAutoPaginate(params?: Omit<ListPaymentLinksParams, "page">) {
    yield* autoPaginate<PaymentLink>((page, limit) => this.list({ ...params, page, limit }), { limit: params?.limit });
  }

  async create(params: CreatePaymentLinkParams): Promise<PaymentLink> {
    return this.client.post<PaymentLink>("/payment-links", params as any);
  }

  async get(id: string): Promise<PaymentLink> {
    return this.client.get<PaymentLink>(`/payment-links/${id}`);
  }

  async update(id: string, params: UpdatePaymentLinkParams): Promise<PaymentLink> {
    return this.client.patch<PaymentLink>(`/payment-links/${id}`, params as any);
  }

  async delete(id: string): Promise<DeletedResponse> {
    return this.client.delete<DeletedResponse>(`/payment-links/${id}`);
  }

  async duplicate(id: string, overrides?: Partial<CreatePaymentLinkParams>): Promise<PaymentLink> {
    return this.client.post<PaymentLink>(`/payment-links/${id}/duplicate`, (overrides ?? {}) as any);
  }

  async stats(id: string, days?: number): Promise<PaymentLinkStats> {
    return this.client.get<PaymentLinkStats>(`/payment-links/${id}/stats`, days !== undefined ? { days } : undefined);
  }

  async sessions(id: string, params?: PaginationParams): Promise<ListResponse<CheckoutSession>> {
    return this.client.get<ListResponse<CheckoutSession>>(`/payment-links/${id}/sessions`, params as any);
  }

  async visitors(
    id: string,
    params?: PaginationParams & { days?: number },
  ): Promise<ListResponse<Record<string, unknown>>> {
    return this.client.get<ListResponse<Record<string, unknown>>>(`/payment-links/${id}/visitors`, params as any);
  }

  async items(id: string): Promise<PaymentLinkItem[]> {
    return this.client.get<PaymentLinkItem[]>(`/payment-links/${id}/items`);
  }

  async addItem(id: string, item: CreatePaymentLinkItemParams): Promise<PaymentLinkItem> {
    return this.client.post<PaymentLinkItem>(`/payment-links/${id}/items`, item as any);
  }

  async removeItem(id: string, itemId: string): Promise<DeletedResponse> {
    return this.client.delete<DeletedResponse>(`/payment-links/${id}/items/${itemId}`);
  }
}
