import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type { CheckoutSession, ListResponse, CreateCheckoutSessionParams, PaginationParams } from "../types";

export interface ListCheckoutSessionsParams extends PaginationParams {
  status?: "open" | "processing" | "completed" | "expired" | "failed";
  payment_link_id?: string;
  from?: number;
  to?: number;
}

export class CheckoutSessionsResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListCheckoutSessionsParams): Promise<ListResponse<CheckoutSession>> {
    return this.client.get<ListResponse<CheckoutSession>>("/checkout-sessions", params);
  }

  async *listAutoPaginate(params?: Omit<ListCheckoutSessionsParams, "page">): AsyncGenerator<CheckoutSession> {
    yield* autoPaginate<CheckoutSession>((page, limit) => this.list({ ...params, page, limit }), {
      limit: params?.limit,
    });
  }

  async create(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
    return this.client.post<CheckoutSession>("/checkout-sessions", params);
  }

  async get(id: string): Promise<CheckoutSession> {
    return this.client.get<CheckoutSession>(`/checkout-sessions/${id}`);
  }

  async expire(id: string): Promise<CheckoutSession> {
    return this.client.post<CheckoutSession>(`/checkout-sessions/${id}/expire`);
  }
}
