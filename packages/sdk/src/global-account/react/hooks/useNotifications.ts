import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { getAuthToken } from "@b3dotfun/sdk/shared/utils/auth-token";
import { useCallback, useEffect, useState } from "react";
import { notificationsAPI, UserData } from "../utils/notificationsAPI";
import { useUserQuery } from "./useUserQuery";

const debug = debugB3React("useNotifications");

export interface UseNotificationsReturn {
  /** User's notification data including channels and settings */
  userData: UserData | null;
  /** Whether the data is currently loading */
  loading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Whether email channel is connected */
  isEmailConnected: boolean;
  /** Whether Telegram channel is connected */
  isTelegramConnected: boolean;
  /** Whether user has any channel connected */
  hasAnyChannelConnected: boolean;
  /** Connect an email channel */
  connectEmail: (email: string) => Promise<void>;
  /** Connect Telegram channel (opens deep link) */
  connectTelegram: () => Promise<void>;
  /** Disconnect a channel */
  disconnectChannel: (channelType: string) => Promise<void>;
  /** Send a test notification */
  sendTestNotification: () => Promise<void>;
  /** Refresh user data */
  refresh: () => Promise<void>;
  /** Telegram connection status */
  telegramStatus: "idle" | "pending" | "connected";
}

/**
 * Hook for managing user notification settings and channels
 * 
 * @example
 * ```typescript
 * const {
 *   userData,
 *   loading,
 *   isEmailConnected,
 *   connectEmail,
 *   sendTestNotification
 * } = useNotifications();
 * 
 * // Connect email
 * await connectEmail('user@example.com');
 * 
 * // Send test
 * await sendTestNotification();
 * ```
 */
export function useNotifications(): UseNotificationsReturn {
  const { user } = useUserQuery();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<"idle" | "pending" | "connected">("idle");

  const userId = (user as any)?.userId;
  const jwtToken = getAuthToken();

  const loadUserData = useCallback(async () => {
    if (!userId || !jwtToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await notificationsAPI.getUser(userId, jwtToken);
      setUserData(data);
      setError(null);
    } catch (err: any) {
      debug("Error loading user data:", err);
      // Try to register the user if they don't exist
      try {
        await notificationsAPI.registerUser(jwtToken);
        const data = await notificationsAPI.getUser(userId, jwtToken);
        setUserData(data);
        setError(null);
      } catch (registerErr: any) {
        debug("Error registering user:", registerErr);
        setError("Failed to load notification settings");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, jwtToken]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const createDefaultNotificationSettings = useCallback(async () => {
    if (!userId || !jwtToken) return;
    
    try {
      // Create settings for test notifications only
      await notificationsAPI.ensureNotificationSettings(userId, "test-app", "test", jwtToken);
    } catch (err) {
      debug("Error creating default notification settings:", err);
    }
  }, [userId, jwtToken]);

  const connectEmail = useCallback(
    async (email: string) => {
      if (!userId || !jwtToken) {
        throw new Error("User not authenticated");
      }

      try {
        await notificationsAPI.connectEmail(userId, email, jwtToken);
        await createDefaultNotificationSettings();
        await loadUserData();
      } catch (err: any) {
        debug("Error connecting email:", err);
        throw new Error("Failed to connect email");
      }
    },
    [userId, jwtToken, loadUserData, createDefaultNotificationSettings],
  );

  const connectTelegram = useCallback(async () => {
    if (!userId || !jwtToken) {
      throw new Error("User not authenticated");
    }

    try {
      const { deepLink } = await notificationsAPI.getTelegramLink(jwtToken);
      window.open(deepLink, "_blank");
      setTelegramStatus("pending");

      // Poll for connection
      const interval = setInterval(async () => {
        try {
          const { connected } = await notificationsAPI.checkTelegramStatus(userId, jwtToken);
          if (connected) {
            clearInterval(interval);
            setTelegramStatus("connected");
            await createDefaultNotificationSettings();
            await loadUserData();
          }
        } catch (err) {
          debug("Error checking Telegram status:", err);
        }
      }, 2000);

      // Stop after 2 minutes
      setTimeout(() => {
        clearInterval(interval);
        if (telegramStatus === "pending") {
          setTelegramStatus("idle");
        }
      }, 120000);
    } catch (err: any) {
      debug("Error connecting Telegram:", err);
      throw new Error("Failed to connect Telegram");
    }
  }, [userId, jwtToken, loadUserData, telegramStatus, createDefaultNotificationSettings]);

  const disconnectChannel = useCallback(
    async (channelType: string) => {
      if (!userId || !jwtToken) {
        throw new Error("User not authenticated");
      }

      try {
        await notificationsAPI.disconnectChannel(userId, channelType, jwtToken);
        await loadUserData();
        if (channelType === "telegram") {
          setTelegramStatus("idle");
        }
      } catch (err: any) {
        debug("Error disconnecting channel:", err);
        throw new Error(`Failed to disconnect ${channelType}`);
      }
    },
    [userId, jwtToken, loadUserData],
  );

  const sendTestNotification = useCallback(async () => {
    if (!userId || !jwtToken) {
      throw new Error("User not authenticated");
    }

    try {
      // The API method now handles ensuring settings exist
      await notificationsAPI.sendTestNotification(userId, jwtToken);
    } catch (err: any) {
      debug("Error sending test notification:", err);
      throw new Error("Failed to send test notification");
    }
  }, [userId, jwtToken]);

  const emailChannel = userData?.channels?.find(c => c.channel_type === "email");
  const telegramChannel = userData?.channels?.find(c => c.channel_type === "telegram");
  const isEmailConnected = emailChannel?.enabled === 1;
  const isTelegramConnected = telegramChannel?.enabled === 1;
  const hasAnyChannelConnected = isEmailConnected || isTelegramConnected;

  return {
    userData,
    loading,
    error,
    isEmailConnected,
    isTelegramConnected,
    hasAnyChannelConnected,
    connectEmail,
    connectTelegram,
    disconnectChannel,
    sendTestNotification,
    refresh: loadUserData,
    telegramStatus,
  };
}

