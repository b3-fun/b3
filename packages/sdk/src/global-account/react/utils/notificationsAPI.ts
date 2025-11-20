import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";

const debug = debugB3React("notificationsAPI");

const API_URL = "https://notifications.b3.fun";

export interface NotificationChannel {
  id: number;
  channel_type: "email" | "telegram" | "discord" | "sms" | "whatsapp" | "in_app";
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

export interface NotificationSettings {
  notificationType: string;
  channels: string[];
}

export const notificationsAPI = {
  /**
   * Register user (requires JWT)
   */
  async registerUser(jwtToken: string): Promise<UserData> {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to register user: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Get user data (requires JWT)
   */
  async getUser(userId: string, jwtToken: string): Promise<UserData> {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to get user: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Connect email (requires JWT)
   */
  async connectEmail(userId: string, email: string, jwtToken: string): Promise<any> {
    const res = await fetch(`${API_URL}/users/${userId}/channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        channelType: "email",
        channelIdentifier: email,
        enabled: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to connect email: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Connect SMS (requires JWT)
   */
  async connectSMS(userId: string, phoneNumber: string, jwtToken: string): Promise<any> {
    const res = await fetch(`${API_URL}/users/${userId}/channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        channelType: "sms",
        channelIdentifier: phoneNumber,
        enabled: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to connect SMS: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Connect WhatsApp (requires JWT)
   */
  async connectWhatsApp(userId: string, phoneNumber: string, jwtToken: string): Promise<any> {
    const res = await fetch(`${API_URL}/users/${userId}/channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        channelType: "whatsapp",
        channelIdentifier: phoneNumber,
        enabled: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to connect WhatsApp: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Connect Discord (requires JWT)
   */
  async connectDiscord(userId: string, discordUserId: string, jwtToken: string): Promise<any> {
    const res = await fetch(`${API_URL}/users/${userId}/channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        channelType: "discord",
        channelIdentifier: discordUserId,
        enabled: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to connect Discord: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Disconnect a channel (requires JWT)
   * Looks up the channel ID by type and deletes it
   */
  async disconnectChannel(userId: string, channelType: string, jwtToken: string): Promise<any> {
    // First, get user data to find the channel ID
    const userData = await this.getUser(userId, jwtToken);
    const channel = userData.channels.find((c: NotificationChannel) => c.channel_type === channelType);
    
    if (!channel) {
      throw new Error(`Channel ${channelType} not found`);
    }

    // Delete using the channel ID
    const res = await fetch(`${API_URL}/users/${userId}/channels/${channel.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to disconnect channel: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Get Telegram deep link (requires JWT)
   */
  async getTelegramLink(jwtToken: string): Promise<{ deepLink: string }> {
    const res = await fetch(`${API_URL}/telegram/request-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to get Telegram link: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Check Telegram status (requires JWT)
   */
  async checkTelegramStatus(userId: string, jwtToken: string): Promise<{ connected: boolean }> {
    const res = await fetch(`${API_URL}/telegram/status/${userId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to check Telegram status: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Save notification preferences (requires JWT)
   */
  async savePreferences(userId: string, appId: string, settings: NotificationSettings, jwtToken: string): Promise<any> {
    const res = await fetch(`${API_URL}/users/${userId}/apps/${appId}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        ...settings,
        enabled: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to save preferences: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Ensure notification settings exist for a user/app/type combination
   * Creates default settings if they don't exist
   */
  async ensureNotificationSettings(
    userId: string,
    appId: string,
    notificationType: string,
    jwtToken: string,
  ): Promise<any> {
    // Get user's connected channels
    const userData = await this.getUser(userId, jwtToken);
    const enabledChannels = userData.channels
      .filter((c: NotificationChannel) => c.enabled === 1)
      .map((c: NotificationChannel) => c.channel_type);

    if (enabledChannels.length === 0) {
      throw new Error("No channels connected");
    }

    // Create settings with all enabled channels
    const res = await fetch(`${API_URL}/users/${userId}/apps/${appId}/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        notificationType,
        channels: enabledChannels,
        enabled: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create notification settings: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Send a test notification (requires JWT)
   * Automatically creates settings if they don't exist
   */
  async sendTestNotification(userId: string, jwtToken: string): Promise<any> {
    // Ensure settings exist for test notifications
    try {
      await this.ensureNotificationSettings(userId, "test-app", "test", jwtToken);
    } catch (err: any) {
      debug("Failed to ensure settings, trying to send anyway:", err);
    }

    const res = await fetch(`${API_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        userId,
        appId: "test-app",
        notificationType: "test",
        title: "Test Notification",
        message:
          "This is a test notification from B3. If you received this, your notifications are working correctly! 🎉",
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to send test notification: ${res.statusText}`);
    }
    return res.json();
  },
};
