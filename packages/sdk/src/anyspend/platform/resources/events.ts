import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type { ApiEvent, ListResponse, PaginationParams } from "../types";

export interface ListEventsParams extends PaginationParams {
  event_type?: string;
  resource_type?: string;
  from?: number;
  to?: number;
}

export class EventsResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListEventsParams): Promise<ListResponse<ApiEvent>> {
    return this.client.get<ListResponse<ApiEvent>>("/events", params as any);
  }

  async *listAutoPaginate(params?: Omit<ListEventsParams, "page">) {
    yield* autoPaginate<ApiEvent>((page, limit) => this.list({ ...params, page, limit }), { limit: params?.limit });
  }
}
