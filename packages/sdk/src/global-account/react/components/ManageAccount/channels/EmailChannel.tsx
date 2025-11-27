import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useState } from "react";
import { notificationsAPI } from "../../../utils/notificationsAPI";
import { useB3 } from "../../B3Provider/useB3";
import { toast } from "../../Toast/toastApi";
import { NotificationChannel } from "../NotificationChannel";

const debug = debugB3React("EmailChannel");

interface EmailChannelProps {
  userId: string;
  jwtToken: string;
  emailChannel: any;
  isConnected: boolean;
  isOptimisticallyConnected: boolean;
  onConnectionChange: () => void;
  onToggle: (enabled: boolean) => void;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const EmailChannel = ({
  userId,
  jwtToken,
  emailChannel,
  isConnected,
  isOptimisticallyConnected,
  onConnectionChange,
  onToggle,
}: EmailChannelProps) => {
  const { partnerId } = useB3();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Detect if we're disconnecting by comparing real vs optimistic state
  const isDisconnecting = isConnected && !isOptimisticallyConnected;

  const handleConnect = async () => {
    if (!email || !userId || !jwtToken) return;

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setIsConnecting(true);
      setEmailError(null);

      await notificationsAPI.connectEmail(userId, email, jwtToken);
      await notificationsAPI.ensureNotificationSettings(userId, partnerId, "general", jwtToken);

      setEmail("");
      setShowInput(false);
      toast.success("Email connected successfully!");
      onConnectionChange();
    } catch (err: any) {
      debug("Error connecting email:", err);
      toast.error("Failed to connect email");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggle = () => {
    if (isConnected) {
      setShowInput(false);
    }
    onToggle(isConnected); // Pass current state - parent will handle disconnect if true
  };

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M3.55588 13.6357C3.056 13.2787 2.80606 13.1001 2.58815 13.077C2.26227 13.0423 1.93568 13.2104 1.77447 13.4957C1.66667 13.6865 1.66668 13.9903 1.66669 14.5978V25.4022C1.66667 26.7438 1.66665 27.8511 1.74035 28.753C1.81689 29.6899 1.98116 30.551 2.39331 31.3599C3.03247 32.6144 4.05234 33.6342 5.30675 34.2734C6.11564 34.6855 6.97682 34.8498 7.91365 34.9263C8.81563 35 9.92288 35 11.2645 35H28.7356C30.0772 35 31.1844 35 32.0864 34.9263C33.0232 34.8498 33.8844 34.6855 34.6933 34.2734C35.9477 33.6342 36.9676 32.6144 37.6067 31.3599C38.0189 30.551 38.1832 29.6899 38.2597 28.753C38.3334 27.8511 38.3334 26.7438 38.3334 25.4022V14.5978C38.3334 14.3 38.3334 14.1511 38.3061 14.0472C38.1828 13.5771 37.6717 13.3094 37.2151 13.4755C37.1141 13.5123 36.9901 13.5981 36.7422 13.7697L23.8386 22.7032C22.9237 23.3386 22.1204 23.8965 21.2078 24.1177C20.4096 24.3112 19.5761 24.305 18.7808 24.0998C17.8716 23.8652 17.0766 23.2956 16.1711 22.6468L3.55588 13.6357Z"
        fill="#0C68E9"
      />
      <path
        d="M36.888 9.61453C37.1957 9.40153 37.3495 9.29503 37.444 9.12373C37.5174 8.99071 37.5594 8.78007 37.5426 8.62908C37.5209 8.43465 37.4383 8.30628 37.273 8.04955C36.6399 7.06607 35.7288 6.25426 34.6933 5.72663C33.8844 5.31447 33.0232 5.1502 32.0864 5.07366C31.1844 4.99996 30.0771 4.99998 28.7355 5H11.2645C9.92292 4.99998 8.81563 4.99996 7.91365 5.07366C6.97682 5.1502 6.11564 5.31447 5.30675 5.72663C4.37503 6.20136 3.56969 6.88767 2.95729 7.72225C2.76463 7.98482 2.6683 8.1161 2.63656 8.31534C2.61174 8.47116 2.6464 8.68762 2.71862 8.8279C2.81098 9.00727 2.97117 9.1217 3.29156 9.35055L17.9167 19.7971C19.1288 20.6628 19.386 20.8135 19.6136 20.8722C19.8787 20.9406 20.1565 20.9426 20.4226 20.8782C20.651 20.8228 20.9104 20.6759 22.1351 19.8281L36.888 9.61453Z"
        fill="#0C68E9"
      />
    </svg>
  );

  const addButtonSection = (
    <button onClick={() => setShowInput(true)} className="mt-1 flex items-center gap-1">
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
        Add Email
      </span>
    </button>
  );

  const inputSection = showInput ? (
    <div className="mt-1 space-y-2">
      <div>
        <input
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && email) {
              handleConnect();
            }
          }}
          placeholder="your@email.com"
          className={`dark:border-b3-line dark:bg-b3-background w-full rounded-lg border px-2 py-1.5 font-['Inter',sans-serif] text-sm focus:outline-none dark:text-white ${
            emailError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
          }`}
        />
        {emailError && (
          <p className="mt-1 font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[12px] leading-[16px] text-red-600">
            {emailError}
          </p>
        )}
      </div>
      <button
        onClick={handleConnect}
        disabled={isConnecting || !email}
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
          {isConnecting ? "Connecting..." : "Add Email"}
        </span>
      </button>
    </div>
  ) : null;

  return (
    <NotificationChannel
      icon={icon}
      title="Email"
      isConnected={isOptimisticallyConnected}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectedInfo={emailChannel?.channel_identifier}
      inputSection={inputSection}
      addButtonSection={addButtonSection}
      onToggle={handleToggle}
    />
  );
};
