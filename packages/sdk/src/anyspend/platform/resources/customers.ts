import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type {
  Customer,
  Transaction,
  ListResponse,
  DeletedResponse,
  CreateCustomerParams,
  UpdateCustomerParams,
  ExportCustomersParams,
  PaginationParams,
} from "../types";

export interface ListCustomersParams extends PaginationParams {
  search?: string;
  sort?: "created_at" | "updated_at" | "total_paid" | "transaction_count";
  order?: "asc" | "desc";
}

export class CustomersResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListCustomersParams): Promise<ListResponse<Customer>> {
    return this.client.get<ListResponse<Customer>>("/customers", params);
  }

  async *listAutoPaginate(params?: Omit<ListCustomersParams, "page">): AsyncGenerator<Customer> {
    yield* autoPaginate<Customer>((page, limit) => this.list({ ...params, page, limit }), { limit: params?.limit });
  }

  async create(params: CreateCustomerParams): Promise<Customer> {
    return this.client.post<Customer>("/customers", params);
  }

  async get(id: string): Promise<Customer> {
    return this.client.get<Customer>(`/customers/${id}`);
  }

  async update(id: string, params: UpdateCustomerParams): Promise<Customer> {
    return this.client.patch<Customer>(`/customers/${id}`, params);
  }

  async delete(id: string): Promise<DeletedResponse> {
    return this.client.delete<DeletedResponse>(`/customers/${id}`);
  }

  async transactions(id: string, params?: PaginationParams): Promise<ListResponse<Transaction>> {
    return this.client.get<ListResponse<Transaction>>(`/customers/${id}/transactions`, params);
  }

  async export(params?: ExportCustomersParams): Promise<string> {
    return this.client.get<string>("/customers/export", params);
  }
}
