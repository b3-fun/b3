import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type {
  DiscountCode,
  ListResponse,
  DeletedResponse,
  CreateDiscountCodeParams,
  BatchCreateDiscountCodesParams,
  ValidateDiscountResult,
  BatchCreateResult,
  PaginationParams,
} from "../types";

export interface ListDiscountCodesParams extends PaginationParams {
  payment_link_id?: string;
  active?: "true" | "false";
  search?: string;
}

export interface UpdateDiscountCodeParams {
  is_active?: boolean;
  max_uses?: number;
  min_order_amount?: string;
  expires_at?: number;
}

export interface ValidateDiscountParams {
  code: string;
  payment_link_id?: string;
  amount?: string;
}

export class DiscountCodesResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListDiscountCodesParams): Promise<ListResponse<DiscountCode>> {
    return this.client.get<ListResponse<DiscountCode>>("/discount-codes", params);
  }

  async *listAutoPaginate(params?: Omit<ListDiscountCodesParams, "page">): AsyncGenerator<DiscountCode> {
    yield* autoPaginate<DiscountCode>((page, limit) => this.list({ ...params, page, limit }), { limit: params?.limit });
  }

  async create(params: CreateDiscountCodeParams): Promise<DiscountCode> {
    return this.client.post<DiscountCode>("/discount-codes", params);
  }

  async update(id: string, params: UpdateDiscountCodeParams): Promise<DiscountCode> {
    return this.client.patch<DiscountCode>(`/discount-codes/${id}`, params);
  }

  async delete(id: string): Promise<DeletedResponse> {
    return this.client.delete<DeletedResponse>(`/discount-codes/${id}`);
  }

  async validate(params: ValidateDiscountParams): Promise<ValidateDiscountResult> {
    return this.client.post<ValidateDiscountResult>("/discount-codes/validate", params);
  }

  async batchCreate(params: BatchCreateDiscountCodesParams): Promise<BatchCreateResult> {
    return this.client.post<BatchCreateResult>("/discount-codes/batch", params);
  }
}
