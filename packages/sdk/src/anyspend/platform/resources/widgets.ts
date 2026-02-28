import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type { WidgetConfig, ListResponse, DeletedResponse, CreateWidgetParams, PaginationParams } from "../types";

export interface ListWidgetsParams extends PaginationParams {
  search?: string;
  widget_type?: "swap" | "checkout" | "nft" | "deposit";
  active?: "true" | "false";
  sort?: "created_at" | "updated_at" | "name" | "current_views";
  order?: "asc" | "desc";
}

export interface UpdateWidgetParams extends Partial<CreateWidgetParams> {
  is_active?: boolean;
}

export interface WidgetStats {
  object: "widget_stats";
  widget_id: string;
  summary: {
    total_views: number;
    total_interactions: number;
    total_completions: number;
  };
  daily: {
    date: string;
    views: number;
    interactions: number;
    completions: number;
  }[];
}

export class WidgetsResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListWidgetsParams): Promise<ListResponse<WidgetConfig>> {
    return this.client.get<ListResponse<WidgetConfig>>("/widgets", params);
  }

  async *listAutoPaginate(params?: Omit<ListWidgetsParams, "page">): AsyncGenerator<WidgetConfig> {
    yield* autoPaginate<WidgetConfig>((page, limit) => this.list({ ...params, page, limit }), { limit: params?.limit });
  }

  async create(params: CreateWidgetParams): Promise<WidgetConfig> {
    return this.client.post<WidgetConfig>("/widgets", params);
  }

  async get(id: string): Promise<WidgetConfig> {
    return this.client.get<WidgetConfig>(`/widgets/${id}`);
  }

  async update(id: string, params: UpdateWidgetParams): Promise<WidgetConfig> {
    return this.client.patch<WidgetConfig>(`/widgets/${id}`, params);
  }

  async delete(id: string): Promise<DeletedResponse> {
    return this.client.delete<DeletedResponse>(`/widgets/${id}`);
  }

  async stats(id: string, days?: number): Promise<WidgetStats> {
    return this.client.get<WidgetStats>(`/widgets/${id}/stats`, days !== undefined ? { days } : undefined);
  }
}
