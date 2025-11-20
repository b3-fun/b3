import { useState, useEffect } from "react";
import { NotificationChannel } from "../NotificationChannel";
import { toast } from "../../Toast/toastApi";
import { notificationsAPI } from "../../../utils/notificationsAPI";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";

const debug = debugB3React("TelegramChannel");

interface TelegramChannelProps {
  userId: string;
  jwtToken: string;
  telegramChannel: any;
  isConnected: boolean;
  isOptimisticallyConnected: boolean;
  onConnectionChange: () => void;
  onToggle: (enabled: boolean) => void;
}

export const TelegramChannel = ({
  userId,
  jwtToken,
  telegramChannel,
  isConnected,
  isOptimisticallyConnected,
  onConnectionChange,
  onToggle,
}: TelegramChannelProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "connected">("idle");
  
  // Detect if we're disconnecting
  const isDisconnecting = isConnected && !isOptimisticallyConnected;

  const handleConnect = async () => {
    if (!userId || !jwtToken) return;

    try {
      setIsConnecting(true);
      const { deepLink } = await notificationsAPI.getTelegramLink(jwtToken);
      window.open(deepLink, "_blank");
      setStatus("pending");

      // Poll for connection
      const interval = setInterval(async () => {
        try {
          const { connected } = await notificationsAPI.checkTelegramStatus(userId, jwtToken);
          if (connected) {
            clearInterval(interval);
            setStatus("connected");
            await notificationsAPI.ensureNotificationSettings(userId, "test-app", "test", jwtToken);
            toast.success("Telegram connected successfully!");
            onConnectionChange();
          }
        } catch (err) {
          debug("Error checking Telegram status:", err);
        }
      }, 2000);

      // Stop after 2 minutes
      setTimeout(() => {
        clearInterval(interval);
        if (status === "pending") {
          setStatus("idle");
        }
      }, 120000);
    } catch (err: any) {
      debug("Error connecting Telegram:", err);
      toast.error("Failed to connect Telegram");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggle = () => {
    if (isConnected) {
      setStatus("idle");
      onToggle(true);
    } else {
      handleConnect();
    }
  };

  const icon = (
    <svg viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="12" fill="#0088cc" />
      <path
        d="M9.5 19.5l6 2.25L18 28l3.5-4.5L28 27l4-17.5L9.5 19.5z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );

  const inputSection =
    status === "pending" ? (
      <div className="mt-1">
        <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-yellow-700">
          Waiting for connection...
        </p>
        <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[12px] text-yellow-600">
          Send /start to @b3_notifications_bot
        </p>
      </div>
    ) : (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="mt-1 flex items-center gap-1 disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3.33333V12.6667M3.33333 8H12.6667"
            stroke="#0c68e9"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-['Inter',sans-serif] text-[11px] font-semibold leading-[16px] text-[#0b57c2]">
          {isConnecting ? "Opening..." : "Add Telegram"}
        </span>
      </button>
    );

  return (
    <NotificationChannel
      icon={icon}
      title="Telegram"
      isConnected={isOptimisticallyConnected || status === "connected"}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectedInfo={telegramChannel?.channel_identifier || "Connected"}
      inputSection={inputSection}
      onToggle={handleToggle}
    />
  );
};

