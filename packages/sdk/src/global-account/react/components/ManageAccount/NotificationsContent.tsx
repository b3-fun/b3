import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { getAuthToken } from "@b3dotfun/sdk/shared/utils/auth-token";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect, useState } from "react";
import { Chain } from "thirdweb";
import { useUserQuery } from "../../hooks/useUserQuery";
import { notificationsAPI, UserData } from "../../utils/notificationsAPI";
import ModalHeader from "../ModalHeader/ModalHeader";
import { toast } from "../Toast/toastApi";
import { DiscordChannel, EmailChannel, PhoneChannel, TelegramChannel } from "./channels";

const debug = debugB3React("NotificationsContent");

interface NotificationsContentProps {
  partnerId: string;
  chain: Chain;
  onSuccess?: () => void;
}

const NotificationsContent = ({ partnerId, chain, onSuccess }: NotificationsContentProps) => {
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const { user } = useUserQuery();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Optimistic UI state
  const [optimisticChannelStates, setOptimisticChannelStates] = useState<Record<string, boolean>>({});

  const userId = (user as any)?.userId;
  const jwtToken = getAuthToken();

  const fetchUserData = async (showLoading = true) => {
    if (!userId || !jwtToken) {
      if (showLoading) setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(true);
  }, [userId, jwtToken]);

  const handleConnectionChange = () => {
    fetchUserData(false); // Refresh without showing loading screen
    onSuccess?.();
  };

  const handleToggleChannel = async (channelType: string, shouldDisconnect: boolean) => {
    if (!userId || !jwtToken) return;

    if (shouldDisconnect) {
      // Optimistically update UI
      setOptimisticChannelStates(prev => ({ ...prev, [channelType]: false }));

      try {
        await notificationsAPI.disconnectChannel(userId, channelType, jwtToken);
        await fetchUserData(false); // Refresh without showing loading screen
        setOptimisticChannelStates(prev => {
          const newState = { ...prev };
          delete newState[channelType];
          return newState;
        });
        toast.success(`${channelType.charAt(0).toUpperCase() + channelType.slice(1)} disconnected successfully!`);
      } catch (err: any) {
        debug("Error disconnecting channel:", err);
        setError(`Failed to disconnect ${channelType}`);
        toast.error(`Failed to disconnect ${channelType}`);
        // Revert optimistic update
        setOptimisticChannelStates(prev => {
          const newState = { ...prev };
          delete newState[channelType];
          return newState;
        });
      }
    }
  };

  const handleSendTestNotification = async () => {
    if (!userId || !jwtToken) return;

    try {
      setIsSendingTest(true);
      setTestSuccess(false);
      await notificationsAPI.sendTestNotification(userId, jwtToken);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 5000);
    } catch (err: any) {
      debug("Error sending test notification:", err);
      setError("Failed to send test notification. Make sure you have at least one channel connected.");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleBack = () => {
    setB3ModalContentType({
      type: "manageAccount",
      chain,
      partnerId,
      activeTab: "settings",
    });
    setB3ModalOpen(true);
  };

  const emailChannel = userData?.channels?.find(c => c.channel_type === "email");
  const smsChannel = userData?.channels?.find(c => c.channel_type === "sms");
  const whatsappChannel = userData?.channels?.find(c => c.channel_type === "whatsapp");
  const telegramChannel = userData?.channels?.find(c => c.channel_type === "telegram");
  const discordChannel = userData?.channels?.find(c => c.channel_type === "discord");

  // Real connection states
  const emailConnected = emailChannel?.enabled === 1;
  const smsConnected = smsChannel?.enabled === 1;
  const whatsappConnected = whatsappChannel?.enabled === 1;
  const telegramConnected = telegramChannel?.enabled === 1;
  const discordConnected = discordChannel?.enabled === 1;

  // Apply optimistic updates
  const optimisticEmailConnected =
    optimisticChannelStates["email"] !== undefined ? optimisticChannelStates["email"] : emailConnected;
  const optimisticSMSConnected =
    optimisticChannelStates["sms"] !== undefined ? optimisticChannelStates["sms"] : smsConnected;
  const optimisticWhatsAppConnected =
    optimisticChannelStates["whatsapp"] !== undefined ? optimisticChannelStates["whatsapp"] : whatsappConnected;
  const optimisticTelegramConnected =
    optimisticChannelStates["telegram"] !== undefined ? optimisticChannelStates["telegram"] : telegramConnected;
  const optimisticDiscordConnected =
    optimisticChannelStates["discord"] !== undefined ? optimisticChannelStates["discord"] : discordConnected;

  const hasAnyChannelConnected =
    optimisticEmailConnected ||
    optimisticSMSConnected ||
    optimisticWhatsAppConnected ||
    optimisticTelegramConnected ||
    optimisticDiscordConnected;

  if (loading) {
    return (
      <div className="flex h-[470px] flex-col">
        <ModalHeader showBackButton={true} showCloseButton={false} title="Notifications" handleBack={handleBack} />
        <div className="flex flex-1 items-center justify-center">
          <div className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[470px] flex-col">
      <ModalHeader showBackButton={true} showCloseButton={false} title="Notifications" handleBack={handleBack} />

      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-6">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[16px] font-semibold leading-none text-[#3f3f46]">
            Push notifications
          </p>
          {/* <button className="flex items-center gap-1">
            <span className="font-['Inter',sans-serif] text-[14px] font-semibold leading-[20px] text-[#0b57c2]">
              Manage All
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="#0c68e9"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button> */}
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Notification Channels Container */}
        {userId && jwtToken && (
          <div className="rounded-[20px] bg-[#f4f4f5]">
            <PhoneChannel
              userId={userId}
              jwtToken={jwtToken}
              smsChannel={smsChannel}
              whatsappChannel={whatsappChannel}
              isSMSConnected={smsConnected}
              isWhatsAppConnected={whatsappConnected}
              isOptimisticallySMSConnected={optimisticSMSConnected}
              isOptimisticallyWhatsAppConnected={optimisticWhatsAppConnected}
              onConnectionChange={handleConnectionChange}
              onToggle={(type, shouldDisconnect) => handleToggleChannel(type, shouldDisconnect)}
            />
            <EmailChannel
              userId={userId}
              jwtToken={jwtToken}
              emailChannel={emailChannel}
              isConnected={emailConnected}
              isOptimisticallyConnected={optimisticEmailConnected}
              onConnectionChange={handleConnectionChange}
              onToggle={enabled => handleToggleChannel("email", enabled)}
            />
            <TelegramChannel
              userId={userId}
              jwtToken={jwtToken}
              telegramChannel={telegramChannel}
              isConnected={telegramConnected}
              isOptimisticallyConnected={optimisticTelegramConnected}
              onConnectionChange={handleConnectionChange}
              onToggle={enabled => handleToggleChannel("telegram", enabled)}
            />
            <DiscordChannel
              userId={userId}
              jwtToken={jwtToken}
              discordChannel={discordChannel}
              isConnected={discordConnected}
              isOptimisticallyConnected={optimisticDiscordConnected}
              onConnectionChange={handleConnectionChange}
              onToggle={enabled => handleToggleChannel("discord", enabled)}
            />
          </div>
        )}

        {/* Test Notification Section */}
        {process.env.NODE_ENV === "development" && hasAnyChannelConnected && (
          <div className="mt-6 rounded-xl border border-[#e4e4e7] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="text-lg">🧪</div>
              <h3 className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] font-semibold leading-[20px] text-gray-900">
                Test Notifications
              </h3>
            </div>
            <p className="mb-3 font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-gray-600">
              Send a test notification to all your connected channels to verify they're working correctly.
            </p>
            <button
              onClick={handleSendTestNotification}
              disabled={isSendingTest}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 font-['Inter',sans-serif] text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {isSendingTest ? "Sending..." : "Send Test Notification"}
            </button>
            {testSuccess && (
              <div className="mt-3 rounded-lg bg-green-50 p-3 font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-green-700">
                ✓ Test notification sent! Check your connected channels.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsContent;
