import type { HttpClient } from "../client";
import type {
  Webhook,
  WebhookDelivery,
  ListResponse,
  DeletedResponse,
  ActionResponse,
  CreateWebhookParams,
  UpdateWebhookParams,
  PaginationParams,
} from "../types";

export class WebhooksResource {
  constructor(private client: HttpClient) {}

  async list(): Promise<ListResponse<Webhook>> {
    return this.client.get<ListResponse<Webhook>>("/webhooks");
  }

  async create(params: CreateWebhookParams): Promise<Webhook> {
    return this.client.post<Webhook>("/webhooks", params);
  }

  async get(id: string): Promise<Webhook> {
    return this.client.get<Webhook>(`/webhooks/${id}`);
  }

  async update(id: string, params: UpdateWebhookParams): Promise<Webhook> {
    return this.client.patch<Webhook>(`/webhooks/${id}`, params);
  }

  async delete(id: string): Promise<DeletedResponse> {
    return this.client.delete<DeletedResponse>(`/webhooks/${id}`);
  }

  async test(id: string): Promise<ActionResponse> {
    return this.client.post<ActionResponse>(`/webhooks/${id}/test`);
  }

  async deliveries(id: string, params?: PaginationParams): Promise<ListResponse<WebhookDelivery>> {
    return this.client.get<ListResponse<WebhookDelivery>>(`/webhooks/${id}/deliveries`, params);
  }

  async retry(id: string, deliveryId: string): Promise<ActionResponse> {
    return this.client.post<ActionResponse>(`/webhooks/${id}/deliveries/${deliveryId}/retry`);
  }
}
