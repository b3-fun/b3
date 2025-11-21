import { cn } from "@b3dotfun/sdk/shared/utils";
import { ReactNode } from "react";

interface NotificationChannelProps {
  icon: ReactNode;
  title: string;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  connectedInfo?: ReactNode;
  inputSection?: ReactNode;
  iconClassName?: string;
  onToggle: () => void;
  showBorder?: boolean;
}

export const NotificationChannel = ({
  icon,
  title,
  isConnected,
  isConnecting,
  isDisconnecting,
  connectedInfo,
  inputSection,
  iconClassName,
  onToggle,
  showBorder = true,
}: NotificationChannelProps) => {
  return (
    <div className={`flex items-start gap-3 p-[15px] ${showBorder ? "border-b border-[#e4e4e7]" : ""}`}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center", iconClassName)}>{icon}</div>
      <div className="flex-1">
        <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] font-semibold leading-[20px] text-[#3f3f46]">
          {title}
        </p>
        {isConnecting ? (
          <div className="mt-1">
            <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-[#51525c]">
              Connecting...
            </p>
          </div>
        ) : isDisconnecting ? (
          <div className="mt-1">
            <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-[#51525c]">
              Disconnecting...
            </p>
          </div>
        ) : isConnected && connectedInfo ? (
          <div className="mt-1">
            <p className="font-['PP_Neue_Montreal','PP_Neue_Montreal_Fallback',sans-serif] text-[14px] leading-[20px] text-[#51525c]">
              {connectedInfo}
            </p>
          </div>
        ) : (
          inputSection
        )}
      </div>
      <ToggleSwitch enabled={isConnected} onChange={onToggle} />
    </div>
  );
};

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
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
};
