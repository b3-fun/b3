import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useState } from "react";
import { notificationsAPI } from "../../../utils/notificationsAPI";
import { useB3 } from "../../B3Provider/useB3";
import { toast } from "../../Toast/toastApi";
import { NotificationChannel } from "../NotificationChannel";

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
  const { partnerId } = useB3();

  const [discordId, setDiscordId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Detect if we're disconnecting
  const isDisconnecting = isConnected && !isOptimisticallyConnected;

  const handleConnect = async () => {
    if (!discordId || !userId || !jwtToken) return;

    try {
      setIsConnecting(true);
      await notificationsAPI.connectDiscord(userId, discordId, jwtToken);
      await notificationsAPI.ensureNotificationSettings(userId, partnerId, "general", jwtToken);

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
    <svg id="Discord-Logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 126.644 96">
      <path
        id="Discord-Symbol-Blurple"
        className="fill-[#ffffff]"
        d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,2.6519,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-12.6788,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z"
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
      iconClassName="bg-[#5865f2] rounded-xl p-2"
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
