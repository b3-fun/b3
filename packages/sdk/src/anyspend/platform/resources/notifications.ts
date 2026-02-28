import type { HttpClient } from "../client";
import type { NotificationSettings, UpdateNotificationSettingsParams, ActionResponse } from "../types";

export interface TelegramLinkResult {
  object: "telegram_link";
  link_url: string;
  link_code: string;
  expires_at: number;
}

export class NotificationsResource {
  constructor(private client: HttpClient) {}

  async get(): Promise<NotificationSettings> {
    return this.client.get<NotificationSettings>("/notifications");
  }

  async update(params: UpdateNotificationSettingsParams): Promise<NotificationSettings> {
    return this.client.patch<NotificationSettings>("/notifications", params as any);
  }

  async linkTelegram(): Promise<TelegramLinkResult> {
    return this.client.post<TelegramLinkResult>("/notifications/telegram/link");
  }

  async unlinkTelegram(): Promise<ActionResponse> {
    return this.client.post<ActionResponse>("/notifications/telegram/unlink");
  }

  async testEmail(): Promise<ActionResponse> {
    return this.client.post<ActionResponse>("/notifications/test/email");
  }

  async testTelegram(): Promise<ActionResponse> {
    return this.client.post<ActionResponse>("/notifications/test/telegram");
  }
}
