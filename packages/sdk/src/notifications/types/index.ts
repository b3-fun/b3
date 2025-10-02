export type ChannelType = "email" | "telegram" | "discord" | "sms" | "whatsapp" | "in_app";

export interface NotificationChannel {
  id: number;
  channel_type: ChannelType;
  enabled: number;
  channel_identifier: string;
}

export interface UserData {
  user: {
    id: number;
    user_id: string;
  };
  channels: NotificationChannel[];
  appSettings: Array<{
    app_id: string;
    notification_type: string;
    enabled: number;
    channels: string;
  }>;
}

export interface NotificationHistory {
  id: string;
  app_id: string;
  notification_type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface TelegramLinkResponse {
  deepLink: string;
  verificationCode: string;
  botUsername: string;
}

export interface TelegramStatusResponse {
  connected: boolean;
  chatId?: string;
}

export interface NotificationPreferences {
  notificationType: string;
  channels: string[];
  enabled?: boolean;
}

export interface SendNotificationRequest {
  userId: string;
  appId: string;
  notificationType: string;
  message: string;
  title?: string;
  data?: Record<string, any>;
}
