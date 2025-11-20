import { useState } from "react";
import { NotificationChannel } from "../NotificationChannel";
import { toast } from "../../Toast/toastApi";
import { notificationsAPI } from "../../../utils/notificationsAPI";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";

const debug = debugB3React("DiscordChannel");

interface DiscordChannelProps {
  userId: string;
  jwtToken: string;
  discordChannel: any;
  isConnected: boolean;
  isOptimisticallyConnected: boolean;
  onConnectionChange: () => void;
  onToggle: (enabled: boolean) => void;
}

export const DiscordChannel = ({
  userId,
  jwtToken,
  discordChannel,
  isConnected,
  isOptimisticallyConnected,
  onConnectionChange,
  onToggle,
}: DiscordChannelProps) => {
  const [discordId, setDiscordId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Detect if we're disconnecting
  const isDisconnecting = isConnected && !isOptimisticallyConnected;

  const handleConnect = async () => {
    if (!discordId || !userId || !jwtToken) return;

    try {
      setIsConnecting(true);
      await notificationsAPI.connectDiscord(userId, discordId, jwtToken);
      await notificationsAPI.ensureNotificationSettings(userId, "test-app", "test", jwtToken);

      setDiscordId("");
      toast.success("Discord connected successfully!");
      onConnectionChange();
    } catch (err: any) {
      debug("Error connecting Discord:", err);
      toast.error("Failed to connect Discord");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggle = () => {
    onToggle(isConnected);
  };

  const icon = (
    <svg viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="12" fill="#5865F2" />
      <path
        d="M27 11.5c-1.3-0.6-2.7-1-4.2-1.3-0.2 0.4-0.4 0.8-0.6 1.2-1.6-0.2-3.2-0.2-4.8 0-0.2-0.4-0.4-0.8-0.6-1.2-1.5 0.3-2.9 0.7-4.2 1.3-2.9 4.3-3.7 8.5-3.3 12.6 1.8 1.3 3.5 2.1 5.2 2.6 0.4-0.5 0.8-1.1 1.1-1.7-0.6-0.2-1.2-0.5-1.7-0.8 0.1-0.1 0.3-0.2 0.4-0.3 3.3 1.5 6.9 1.5 10.2 0 0.1 0.1 0.3 0.2 0.4 0.3-0.5 0.3-1.1 0.6-1.7 0.8 0.3 0.6 0.7 1.2 1.1 1.7 1.7-0.5 3.4-1.3 5.2-2.6 0.5-4.8-0.9-9-3.5-12.6z"
        fill="white"
      />
    </svg>
  );

  const inputSection = (
    <div className="mt-1 space-y-2">
      <input
        type="text"
        value={discordId}
        onChange={e => setDiscordId(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && discordId) {
            handleConnect();
          }
        }}
        placeholder="Discord User ID"
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 font-['Inter',sans-serif] text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        onClick={handleConnect}
        disabled={isConnecting || !discordId}
        className="flex items-center gap-1 disabled:opacity-50"
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
          {isConnecting ? "Connecting..." : "Add Discord"}
        </span>
      </button>
    </div>
  );

  return (
    <NotificationChannel
      icon={icon}
      title="Discord"
      isConnected={isOptimisticallyConnected}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectedInfo={discordChannel?.channel_identifier}
      inputSection={inputSection}
      onToggle={handleToggle}
      showBorder={false}
    />
  );
};

