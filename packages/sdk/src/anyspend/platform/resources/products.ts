import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type {
  Product,
  PaymentLink,
  ListResponse,
  DeletedResponse,
  CreateProductParams,
  UpdateProductParams,
  PaginationParams,
} from "../types";

export interface ListProductsParams extends PaginationParams {
  search?: string;
  active?: "true" | "false";
  product_type?: "one_time" | "subscription" | "variable";
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
}

export interface GenerateLinkParams {
  recipient_address?: string;
  name?: string;
  description?: string;
  theme_color?: string;
  button_text?: string;
}

export class ProductsResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListProductsParams): Promise<ListResponse<Product>> {
    return this.client.get<ListResponse<Product>>("/products", params as any);
  }

  async *listAutoPaginate(params?: Omit<ListProductsParams, "page">) {
    yield* autoPaginate<Product>((page, limit) => this.list({ ...params, page, limit }), { limit: params?.limit });
  }

  async create(params: CreateProductParams): Promise<Product> {
    return this.client.post<Product>("/products", params as any);
  }

  async get(id: string): Promise<Product> {
    return this.client.get<Product>(`/products/${id}`);
  }

  async update(id: string, params: UpdateProductParams): Promise<Product> {
    return this.client.patch<Product>(`/products/${id}`, params as any);
  }

  async delete(id: string): Promise<DeletedResponse> {
    return this.client.delete<DeletedResponse>(`/products/${id}`);
  }

  async generateLink(id: string, params?: GenerateLinkParams): Promise<PaymentLink> {
    return this.client.post<PaymentLink>(`/products/${id}/generate-link`, (params ?? {}) as any);
  }
}
