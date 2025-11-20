import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { getAuthToken } from "@b3dotfun/sdk/shared/utils/auth-token";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useEffect, useState } from "react";
import { Chain } from "thirdweb";
import { useUserQuery } from "../../hooks/useUserQuery";
import { notificationsAPI, UserData } from "../../utils/notificationsAPI";
import ModalHeader from "../ModalHeader/ModalHeader";

const debug = debugB3React("NotificationsContent");

interface NotificationsContentProps {
  partnerId: string;
  chain: Chain;
  onSuccess?: () => void;
}

// Toggle Switch Component
const ToggleSwitch = ({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
        enabled ? "bg-[#0c68e9]" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
};

const NotificationsContent = ({ partnerId, chain, onSuccess }: NotificationsContentProps) => {
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const { user } = useUserQuery();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  const [isConnectingSMS, setIsConnectingSMS] = useState(false);
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<"idle" | "pending" | "connected">("idle");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const userId = (user as any)?.userId;
  const jwtToken = getAuthToken();

  useEffect(() => {
    const loadUserData = async () => {
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
    };

    loadUserData();
  }, [userId, jwtToken]);

  const createDefaultNotificationSettings = async () => {
    if (!userId || !jwtToken) return;

    try {
      // Create settings for test notifications only
      await notificationsAPI.ensureNotificationSettings(userId, "test-app", "test", jwtToken);
    } catch (err) {
      debug("Error creating default notification settings:", err);
    }
  };

  const handleConnectEmail = async () => {
    if (!email || !userId || !jwtToken) return;

    try {
      setIsConnectingEmail(true);
      await notificationsAPI.connectEmail(userId, email, jwtToken);

      // Create default notification settings for common types
      await createDefaultNotificationSettings();

      const updated = await notificationsAPI.getUser(userId, jwtToken);
      setUserData(updated);
      setEmail("");
      onSuccess?.();
    } catch (err: any) {
      debug("Error connecting email:", err);
      setError("Failed to connect email");
    } finally {
      setIsConnectingEmail(false);
    }
  };

  const handleConnectSMS = async () => {
    if (!phoneNumber || !userId || !jwtToken) return;

    try {
      setIsConnectingSMS(true);
      await notificationsAPI.connectSMS(userId, phoneNumber, jwtToken);
      await createDefaultNotificationSettings();

      const updated = await notificationsAPI.getUser(userId, jwtToken);
      setUserData(updated);
      setPhoneNumber("");
      onSuccess?.();
    } catch (err: any) {
      debug("Error connecting SMS:", err);
      setError("Failed to connect SMS");
    } finally {
      setIsConnectingSMS(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    if (!phoneNumber || !userId || !jwtToken) return;

    try {
      setIsConnectingWhatsApp(true);
      await notificationsAPI.connectWhatsApp(userId, phoneNumber, jwtToken);
      await createDefaultNotificationSettings();

      const updated = await notificationsAPI.getUser(userId, jwtToken);
      setUserData(updated);
      setPhoneNumber("");
      onSuccess?.();
    } catch (err: any) {
      debug("Error connecting WhatsApp:", err);
      setError("Failed to connect WhatsApp");
    } finally {
      setIsConnectingWhatsApp(false);
    }
  };

  const handleConnectDiscord = async () => {
    if (!discordId || !userId || !jwtToken) return;

    try {
      setIsConnectingDiscord(true);
      await notificationsAPI.connectDiscord(userId, discordId, jwtToken);
      await createDefaultNotificationSettings();

      const updated = await notificationsAPI.getUser(userId, jwtToken);
      setUserData(updated);
      setDiscordId("");
      onSuccess?.();
    } catch (err: any) {
      debug("Error connecting Discord:", err);
      setError("Failed to connect Discord");
    } finally {
      setIsConnectingDiscord(false);
    }
  };

  const handleConnectTelegram = async () => {
    if (!userId || !jwtToken) return;

    try {
      setIsConnectingTelegram(true);
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

            // Create default notification settings
            await createDefaultNotificationSettings();

            const updated = await notificationsAPI.getUser(userId, jwtToken);
            setUserData(updated);
            onSuccess?.();
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
      setError("Failed to connect Telegram");
    } finally {
      setIsConnectingTelegram(false);
    }
  };

  const handleToggleChannel = async (channelType: string, currentlyEnabled: boolean) => {
    if (!userId || !jwtToken) return;

    if (currentlyEnabled) {
      // Disconnect
      try {
        await notificationsAPI.disconnectChannel(userId, channelType, jwtToken);
        const updated = await notificationsAPI.getUser(userId, jwtToken);
        setUserData(updated);
        if (channelType === "telegram") {
          setTelegramStatus("idle");
        }
      } catch (err: any) {
        debug("Error disconnecting channel:", err);
        setError(`Failed to disconnect ${channelType}`);
      }
    } else {
      // Connect - for channels that need user input, do nothing (they should use Add button)
      if (channelType === "telegram") {
        handleConnectTelegram();
      }
      // For email, SMS, WhatsApp, Discord - user needs to provide identifier via Add button
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
  const emailConnected = emailChannel?.enabled === 1;
  const smsConnected = smsChannel?.enabled === 1;
  const whatsappConnected = whatsappChannel?.enabled === 1;
  const telegramConnected = telegramChannel?.enabled === 1;
  const discordConnected = discordChannel?.enabled === 1;
  const hasAnyChannelConnected =
    emailConnected || smsConnected || whatsappConnected || telegramConnected || discordConnected;

  if (loading) {
    return (
      <div className="flex h-[470px] flex-col">
        <ModalHeader showBackButton={true} showCloseButton={false} title="Notifications" handleBack={handleBack} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[470px] flex-col">
      <ModalHeader showBackButton={true} showCloseButton={false} title="Notifications" handleBack={handleBack} />

      <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-0 pt-6">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <p className="font-['PP_Neue_Montreal'] text-base font-semibold text-[#3f3f46]">Push notifications</p>
          <button className="flex items-center gap-1 text-sm font-semibold text-[#0b57c2]">
            <span>Manage All</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Notification Channels Container */}
        <div className="rounded-[20px] bg-[#f4f4f5]">
          {/* SMS/WhatsApp */}
          <div className="flex items-start gap-3 border-b border-[#e4e4e7] p-[15px]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0c68e9]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.38 8.85l-0.9 0.38c-0.54 0.23-0.88 0.77-0.88 1.36v0c0 0.59 0.34 1.13 0.88 1.36l3.12 1.34c0.75 0.32 1.59 0.32 2.34 0l3.12-1.34c0.54-0.23 0.88-0.77 0.88-1.36v0c0-0.59-0.34-1.13-0.88-1.36l-0.9-0.38M8.5 13.5v4c0 0.83 0.67 1.5 1.5 1.5h4c0.83 0 1.5-0.67 1.5-1.5v-4M6.62 5.36l4.5-2.25c0.55-0.27 1.21-0.27 1.76 0l4.5 2.25"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-['PP_Neue_Montreal'] text-sm font-semibold text-[#3f3f46]">SMS/WhatsApp</p>
              <div className="mt-1">
                {smsConnected || whatsappConnected ? (
                  <>
                    {smsConnected && <p className="text-sm text-[#51525c]">SMS: {smsChannel?.channel_identifier}</p>}
                    {whatsappConnected && (
                      <p className="text-sm text-[#51525c]">WhatsApp: {whatsappChannel?.channel_identifier}</p>
                    )}
                    <button className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2]">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 3.33333V12.6667M3.33333 8H12.6667"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Add Phone
                    </button>
                  </>
                ) : (
                  <div className="mt-1 space-y-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleConnectSMS}
                        disabled={isConnectingSMS || !phoneNumber}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2] disabled:opacity-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 3.33333V12.6667M3.33333 8H12.6667"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {isConnectingSMS ? "Connecting..." : "Add SMS"}
                      </button>
                      <span className="text-[11px] text-gray-400">|</span>
                      <button
                        onClick={handleConnectWhatsApp}
                        disabled={isConnectingWhatsApp || !phoneNumber}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2] disabled:opacity-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 3.33333V12.6667M3.33333 8H12.6667"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {isConnectingWhatsApp ? "Connecting..." : "Add WhatsApp"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ToggleSwitch
              enabled={smsConnected || whatsappConnected}
              onChange={() => {
                if (smsConnected) handleToggleChannel("sms", true);
                if (whatsappConnected) handleToggleChannel("whatsapp", true);
              }}
            />
          </div>

          {/* Email */}
          <div className="flex items-start gap-3 border-b border-[#e4e4e7] p-[15px]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0c68e9]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 7L10.1649 12.7154C10.8261 13.1783 11.1567 13.4097 11.5163 13.4993C11.8339 13.5785 12.1661 13.5785 12.4837 13.4993C12.8433 13.4097 13.1739 13.1783 13.8351 12.7154L22 7M6.8 20H17.2C18.8802 20 19.7202 20 20.362 19.673C20.9265 19.3854 21.3854 18.9265 21.673 18.362C22 17.7202 22 16.8802 22 15.2V8.8C22 7.11984 22 6.27976 21.673 5.63803C21.3854 5.07354 20.9265 4.6146 20.362 4.32698C19.7202 4 18.8802 4 17.2 4H6.8C5.11984 4 4.27976 4 3.63803 4.32698C3.07354 4.6146 2.6146 5.07354 2.32698 5.63803C2 6.27976 2 7.11984 2 8.8V15.2C2 16.8802 2 17.7202 2.32698 18.362C2.6146 18.9265 3.07354 19.3854 3.63803 19.673C4.27976 20 5.11984 20 6.8 20Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-['PP_Neue_Montreal'] text-sm font-semibold text-[#3f3f46]">Email</p>
              {emailConnected ? (
                <div className="mt-1">
                  <p className="text-sm text-[#51525c]">{emailChannel?.channel_identifier}</p>
                  <button className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3.33333V12.6667M3.33333 8H12.6667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Add Email
                  </button>
                </div>
              ) : (
                <div className="mt-1 space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleConnectEmail}
                    disabled={isConnectingEmail || !email}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2] disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3.33333V12.6667M3.33333 8H12.6667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {isConnectingEmail ? "Connecting..." : "Add Email"}
                  </button>
                </div>
              )}
            </div>
            <ToggleSwitch enabled={emailConnected} onChange={() => handleToggleChannel("email", emailConnected)} />
          </div>

          {/* Telegram */}
          <div className="flex items-start gap-3 border-b border-[#e4e4e7] p-[15px]">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
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
            </div>
            <div className="flex-1">
              <p className="font-['PP_Neue_Montreal'] text-sm font-semibold text-[#3f3f46]">Telegram</p>
              {telegramConnected || telegramStatus === "connected" ? (
                <div className="mt-1">
                  <p className="text-sm text-[#51525c]">Connected</p>
                  <button className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3.33333V12.6667M3.33333 8H12.6667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Add Telegram
                  </button>
                </div>
              ) : telegramStatus === "pending" ? (
                <div className="mt-1">
                  <p className="text-sm text-yellow-700">Waiting for connection...</p>
                  <p className="text-xs text-yellow-600">Send /start to @b3_notifications_bot</p>
                </div>
              ) : (
                <button
                  onClick={handleConnectTelegram}
                  disabled={isConnectingTelegram}
                  className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2] disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3.33333V12.6667M3.33333 8H12.6667"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isConnectingTelegram ? "Opening..." : "Add Telegram"}
                </button>
              )}
            </div>
            <ToggleSwitch
              enabled={telegramConnected || telegramStatus === "connected"}
              onChange={() => handleToggleChannel("telegram", telegramConnected || telegramStatus === "connected")}
            />
          </div>

          {/* Discord */}
          <div className="flex items-start gap-3 p-[15px]">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
              <svg viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="12" fill="#5865F2" />
                <path
                  d="M27 11.5c-1.3-0.6-2.7-1-4.2-1.3-0.2 0.4-0.4 0.8-0.6 1.2-1.6-0.2-3.2-0.2-4.8 0-0.2-0.4-0.4-0.8-0.6-1.2-1.5 0.3-2.9 0.7-4.2 1.3-2.9 4.3-3.7 8.5-3.3 12.6 1.8 1.3 3.5 2.1 5.2 2.6 0.4-0.5 0.8-1.1 1.1-1.7-0.6-0.2-1.2-0.5-1.7-0.8 0.1-0.1 0.3-0.2 0.4-0.3 3.3 1.5 6.9 1.5 10.2 0 0.1 0.1 0.3 0.2 0.4 0.3-0.5 0.3-1.1 0.6-1.7 0.8 0.3 0.6 0.7 1.2 1.1 1.7 1.7-0.5 3.4-1.3 5.2-2.6 0.5-4.8-0.9-9-3.5-12.6z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-['PP_Neue_Montreal'] text-sm font-semibold text-[#3f3f46]">Discord</p>
              {discordConnected ? (
                <div className="mt-1">
                  <p className="text-sm text-[#51525c]">{discordChannel?.channel_identifier}</p>
                  <button className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3.33333V12.6667M3.33333 8H12.6667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Add Discord
                  </button>
                </div>
              ) : (
                <div className="mt-1 space-y-2">
                  <input
                    type="text"
                    value={discordId}
                    onChange={e => setDiscordId(e.target.value)}
                    placeholder="Discord User ID"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleConnectDiscord}
                    disabled={isConnectingDiscord || !discordId}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#0b57c2] disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3.33333V12.6667M3.33333 8H12.6667"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {isConnectingDiscord ? "Connecting..." : "Add Discord"}
                  </button>
                </div>
              )}
            </div>
            <ToggleSwitch
              enabled={discordConnected}
              onChange={() => handleToggleChannel("discord", discordConnected)}
            />
          </div>
        </div>

        {/* Test Notification Section */}
        {hasAnyChannelConnected && (
          <div className="mt-4 rounded-xl border border-[#e4e4e7] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="text-lg">🧪</div>
              <h3 className="font-semibold text-gray-900">Test Notifications</h3>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              Send a test notification to all your connected channels to verify they're working correctly.
            </p>
            <button
              onClick={handleSendTestNotification}
              disabled={isSendingTest}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {isSendingTest ? "Sending..." : "Send Test Notification"}
            </button>
            {testSuccess && (
              <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
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
