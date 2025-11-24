import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useState } from "react";
import { notificationsAPI } from "../../../utils/notificationsAPI";
import { useB3 } from "../../B3Provider/useB3";
import { toast } from "../../Toast/toastApi";
import { NotificationChannel } from "../NotificationChannel";

const debug = debugB3React("PhoneChannel");

interface PhoneChannelProps {
  userId: string;
  jwtToken: string;
  smsChannel: any;
  whatsappChannel: any;
  isSMSConnected: boolean;
  isWhatsAppConnected: boolean;
  isOptimisticallySMSConnected: boolean;
  isOptimisticallyWhatsAppConnected: boolean;
  onConnectionChange: () => void;
  onToggle: (type: "sms" | "whatsapp", enabled: boolean) => void;
}

export const PhoneChannel = ({
  userId,
  jwtToken,
  smsChannel,
  whatsappChannel,
  isSMSConnected,
  isWhatsAppConnected,
  isOptimisticallySMSConnected,
  isOptimisticallyWhatsAppConnected,
  onConnectionChange,
  onToggle,
}: PhoneChannelProps) => {
  const { partnerId } = useB3();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isConnectingSMS, setIsConnectingSMS] = useState(false);
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Detect if we're disconnecting
  const isDisconnecting =
    (isSMSConnected && !isOptimisticallySMSConnected) || (isWhatsAppConnected && !isOptimisticallyWhatsAppConnected);

  const handleConnectSMS = async () => {
    if (!phoneNumber || !userId || !jwtToken) return;

    try {
      setIsConnectingSMS(true);
      await notificationsAPI.connectSMS(userId, phoneNumber, jwtToken);
      await notificationsAPI.ensureNotificationSettings(userId, partnerId, "general", jwtToken);

      setPhoneNumber("");
      setShowInput(false);
      toast.success("SMS connected successfully!");
      onConnectionChange();
    } catch (err: any) {
      debug("Error connecting SMS:", err);
      toast.error("Failed to connect SMS");
    } finally {
      setIsConnectingSMS(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    if (!phoneNumber || !userId || !jwtToken) return;

    try {
      setIsConnectingWhatsApp(true);
      await notificationsAPI.connectWhatsApp(userId, phoneNumber, jwtToken);
      await notificationsAPI.ensureNotificationSettings(userId, partnerId, "general", jwtToken);

      setPhoneNumber("");
      setShowInput(false);
      toast.success("WhatsApp connected successfully!");
      onConnectionChange();
    } catch (err: any) {
      debug("Error connecting WhatsApp:", err);
      toast.error("Failed to connect WhatsApp");
    } finally {
      setIsConnectingWhatsApp(false);
    }
  };

  const handleToggle = () => {
    if (isSMSConnected || isWhatsAppConnected) {
      setShowInput(false);
    }
    if (isSMSConnected) onToggle("sms", true);
    if (isWhatsAppConnected) onToggle("whatsapp", true);
  };

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26.7596 36.4673C21.4375 34.9568 16.416 32.1062 12.2299 27.9201C8.04385 23.7341 5.19327 18.7125 3.68271 13.3905C3.67375 13.3589 3.66487 13.3277 3.65605 13.2966C3.4102 12.4316 3.21956 11.7608 3.21682 10.841C3.21369 9.78971 3.5562 8.47265 4.07108 7.55607C4.95655 5.97979 6.85783 3.9597 8.50003 3.12908C9.91893 2.4114 11.5946 2.4114 13.0135 3.12908C14.4172 3.83908 15.9806 5.42835 16.8521 6.76878C17.9296 8.42601 17.9296 10.5625 16.8521 12.2197C16.5633 12.6638 16.1518 13.0746 15.674 13.5516C15.5253 13.7001 15.3615 13.8074 15.4702 14.0339C16.5499 16.2827 18.0224 18.392 19.8902 20.2598C21.758 22.1276 23.8674 23.6001 26.1162 24.6798C26.3506 24.7924 26.443 24.6317 26.5985 24.476C27.0754 23.9983 27.4863 23.5867 27.9304 23.298C29.5876 22.2205 31.724 22.2205 33.3813 23.298C34.6858 24.1462 36.3165 25.7438 37.021 27.1365C37.7386 28.5554 37.7386 30.2311 37.021 31.65C36.1903 33.2922 34.1703 35.1935 32.594 36.079C31.6774 36.5938 30.3603 36.9364 29.309 36.9332C28.3892 36.9305 27.7184 36.7398 26.8534 36.494C26.8224 36.4852 26.7911 36.4763 26.7596 36.4673Z"
        fill="#0C68E9"
      />
    </svg>
  );

  const addButtonSection = (
    <div className="mt-1 flex gap-2">
      <button onClick={() => setShowInput(true)} className="flex items-center gap-1">
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
          Add SMS
        </span>
      </button>
      <span className="text-[11px] text-gray-400">|</span>
      <button onClick={() => setShowInput(true)} className="flex items-center gap-1">
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
          Add WhatsApp
        </span>
      </button>
    </div>
  );

  const inputSection = showInput ? (
    <div className="mt-1 space-y-2">
      <input
        type="tel"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && phoneNumber) {
            handleConnectSMS();
          }
        }}
        placeholder="+1 (555) 123-4567"
        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 font-['Inter',sans-serif] text-sm focus:border-blue-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleConnectSMS}
          disabled={isConnectingSMS || !phoneNumber}
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
            {isConnectingSMS ? "Connecting..." : "Add SMS"}
          </span>
        </button>
        <span className="text-[11px] text-gray-400">|</span>
        <button
          onClick={handleConnectWhatsApp}
          disabled={isConnectingWhatsApp || !phoneNumber}
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
            {isConnectingWhatsApp ? "Connecting..." : "Add WhatsApp"}
          </span>
        </button>
      </div>
    </div>
  ) : null;

  const connectedInfo = (
    <>
      {isSMSConnected && (
        <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-[#51525c]">
          {smsChannel?.channel_identifier}
        </p>
      )}
      {isWhatsAppConnected && (
        <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-[#51525c]">
          {whatsappChannel?.channel_identifier}
        </p>
      )}
    </>
  );

  return (
    <NotificationChannel
      icon={icon}
      title="SMS/WhatsApp"
      isConnected={isOptimisticallySMSConnected || isOptimisticallyWhatsAppConnected}
      isConnecting={isConnectingSMS || isConnectingWhatsApp}
      isDisconnecting={isDisconnecting}
      connectedInfo={
        isSMSConnected || isWhatsAppConnected ? (
          <div className="mt-1 flex flex-col gap-1">{connectedInfo}</div>
        ) : undefined
      }
      inputSection={inputSection}
      addButtonSection={addButtonSection}
      onToggle={handleToggle}
    />
  );
};
