import { useEffect, useRef, useState } from "react";
import { notificationsAPI } from "../../services/api";
import type { UserData } from "../../types";

/**
 * React hook for managing B3 notifications
 * Automatically uses the authenticated user's ID from JWT
 *
 * @example
 * ```tsx
 * import { useNotifications } from '@b3dotfun/sdk/notifications/react';
 *
 * function NotificationSettings() {
 *   const { user, loading, connectEmail, connectTelegram, isEmailConnected } = useNotifications();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {!isEmailConnected && (
 *         <button onClick={() => connectEmail('user@example.com')}>
 *           Connect Email
 *         </button>
 *       )}
 *       <button onClick={connectTelegram}>Connect Telegram</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotifications() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refs to track polling timers for cleanup
  const telegramPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const telegramPollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function for Telegram polling
  const cleanupTelegramPolling = () => {
    if (telegramPollIntervalRef.current) {
      clearInterval(telegramPollIntervalRef.current);
      telegramPollIntervalRef.current = null;
    }
    if (telegramPollTimeoutRef.current) {
      clearTimeout(telegramPollTimeoutRef.current);
      telegramPollTimeoutRef.current = null;
    }
  };

  // Load user data on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      cleanupTelegramPolling();
    };
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await notificationsAPI.getUser();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load user"));
      console.error("Failed to load user:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectEmail = async (email: string) => {
    try {
      await notificationsAPI.connectEmail(email);
      await loadUser(); // Refresh user data
    } catch (err) {
      console.error("Failed to connect email:", err);
      throw err;
    }
  };

  const connectTelegram = async () => {
    try {
      // Clear any existing polling before starting new one
      cleanupTelegramPolling();

      const { deepLink } = await notificationsAPI.getTelegramLink();
      window.open(deepLink, "_blank");

      // Poll for connection status
      telegramPollIntervalRef.current = setInterval(async () => {
        try {
          const { connected } = await notificationsAPI.checkTelegramStatus();
          if (connected) {
            cleanupTelegramPolling();
            await loadUser(); // Refresh user data
          }
        } catch (err) {
          console.error("Failed to check Telegram status:", err);
        }
      }, 2000);

      // Stop polling after 2 minutes
      telegramPollTimeoutRef.current = setTimeout(() => {
        cleanupTelegramPolling();
      }, 120000);
    } catch (err) {
      console.error("Failed to connect Telegram:", err);
      throw err;
    }
  };

  const updateChannel = async (channelId: string, updates: { enabled?: boolean }) => {
    try {
      await notificationsAPI.updateChannel(channelId, updates);
      await loadUser(); // Refresh user data
    } catch (err) {
      console.error("Failed to update channel:", err);
      throw err;
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      await notificationsAPI.deleteChannel(channelId);
      await loadUser(); // Refresh user data
    } catch (err) {
      console.error("Failed to delete channel:", err);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    refresh: loadUser,
    connectEmail,
    connectTelegram,
    updateChannel,
    deleteChannel,
    // Convenience helpers
    isEmailConnected: user?.channels?.find(c => c.channel_type === "email")?.enabled === 1,
    isTelegramConnected: user?.channels?.find(c => c.channel_type === "telegram")?.enabled === 1,
    isDiscordConnected: user?.channels?.find(c => c.channel_type === "discord")?.enabled === 1,
  };
}
