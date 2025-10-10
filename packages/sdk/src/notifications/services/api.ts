import { getAuthToken } from "@b3dotfun/sdk/shared/utils/auth-token";
import type {
  NotificationHistory,
  NotificationPreferences,
  SendNotificationRequest,
  TelegramLinkResponse,
  TelegramStatusResponse,
  UserData,
} from "../types";

const DEFAULT_API_URL = "https://notifications.b3.fun";

let apiUrl: string = DEFAULT_API_URL;

export function setApiUrl(url: string) {
  apiUrl = url;
}

export function getApiUrl(): string {
  return apiUrl;
}

function getHeaders(includeAuth = false): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

export const notificationsAPI = {
  // ===== USER MANAGEMENT =====

  /**
   * Register the current user (userId extracted from JWT)
   */
  async registerUser() {
    const res = await fetch(`${apiUrl}/users`, {
      method: "POST",
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Could not read error body");
      throw new Error(`API Error: ${res.status} ${res.statusText} - ${errorBody}`);
    }
    return res.json();
  },

  /**
   * Get current user's profile and preferences
   */
  async getUser(): Promise<UserData> {
    const res = await fetch(`${apiUrl}/users/me`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  /**
   * Get current user's notification history
   */
  async getHistory(appId?: string, limit = 100): Promise<NotificationHistory[]> {
    const params = new URLSearchParams();
    if (appId) params.append("appId", appId);
    params.append("limit", limit.toString());

    const res = await fetch(`${apiUrl}/users/me/history?${params}`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  // ===== CHANNELS =====

  /**
   * Add a notification channel for current user
   */
  async addChannel(channelType: string, channelIdentifier: string, metadata?: Record<string, any>) {
    const res = await fetch(`${apiUrl}/users/me/channels`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({
        channelType,
        channelIdentifier,
        enabled: true,
        metadata,
      }),
    });
    return res.json();
  },

  /**
   * Connect email for current user
   */
  async connectEmail(email: string) {
    return this.addChannel("email", email);
  },

  /**
   * Update a notification channel
   */
  async updateChannel(
    channelId: string,
    updates: { enabled?: boolean; channelIdentifier?: string; metadata?: Record<string, any> },
  ) {
    const res = await fetch(`${apiUrl}/users/me/channels/${channelId}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  /**
   * Delete a notification channel
   */
  async deleteChannel(channelId: string) {
    const res = await fetch(`${apiUrl}/users/me/channels/${channelId}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return res.json();
  },

  // ===== TELEGRAM =====

  /**
   * Get Telegram deep link for current user
   */
  async getTelegramLink(): Promise<TelegramLinkResponse> {
    const res = await fetch(`${apiUrl}/telegram/request-link`, {
      method: "POST",
      headers: getHeaders(true),
    });
    return res.json();
  },

  /**
   * Check current user's Telegram connection status
   */
  async checkTelegramStatus(): Promise<TelegramStatusResponse> {
    const res = await fetch(`${apiUrl}/telegram/status/me`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  // ===== APP PREFERENCES =====

  /**
   * Save notification preferences for an app
   * @param appId - The application ID
   * @param settings - Notification preferences including channels, type, and enabled status (defaults to true)
   */
  async savePreferences(appId: string, settings: NotificationPreferences) {
    const res = await fetch(`${apiUrl}/users/me/apps/${appId}/settings`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ enabled: true, ...settings }),
    });
    return res.json();
  },

  /**
   * Get notification settings for an app
   */
  async getAppSettings(appId: string) {
    const res = await fetch(`${apiUrl}/users/me/apps/${appId}/settings`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  // ===== IN-APP NOTIFICATIONS =====

  /**
   * Get current user's in-app notifications
   */
  async getInAppNotifications() {
    const res = await fetch(`${apiUrl}/users/me/notifications`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    const res = await fetch(`${apiUrl}/users/me/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: getHeaders(true),
    });
    return res.json();
  },

  // ===== SENDING NOTIFICATIONS =====

  /**
   * Send a notification (requires auth)
   */
  async sendNotification(data: SendNotificationRequest) {
    const res = await fetch(`${apiUrl}/send`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
