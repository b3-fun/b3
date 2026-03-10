import app from "@b3dotfun/sdk/global-account/app";
import { useAuthentication, useModalStore } from "@b3dotfun/sdk/global-account/react";
import {
  getSessionDurationDays,
  SESSION_DURATION_LABELS,
  SESSION_DURATION_OPTIONS,
  SessionDurationDays,
  setSessionDurationDays,
} from "@b3dotfun/sdk/shared/utils/session-duration";
import { useState } from "react";
import ModalHeader from "../ModalHeader/ModalHeader";

interface SessionDurationContentProps {
  partnerId: string;
}

const DESCRIPTIONS: Record<SessionDurationDays, string> = {
  0: "Sign out when browser closes",
  1: "Stay signed in for 1 day",
  7: "Stay signed in for 7 days",
  14: "Stay signed in for 2 weeks",
  30: "Stay signed in for 30 days",
};

const SessionDurationContent = ({ partnerId }: SessionDurationContentProps) => {
  const { user, setUser } = useAuthentication(partnerId);
  const navigateBack = useModalStore(state => state.navigateBack);
  const [sessionDays, setSessionDays] = useState<SessionDurationDays>(() =>
    getSessionDurationDays(user?.preferences, partnerId),
  );
  const [saving, setSaving] = useState(false);

  const handleSelect = async (days: SessionDurationDays) => {
    const previous = sessionDays;
    setSessionDurationDays(days, partnerId);
    setSessionDays(days);
    if (user?.userId) {
      setSaving(true);
      try {
        const updated = await app.service("users").patch(user.userId, {
          preferences: {
            ...user.preferences,
            [partnerId]: {
              ...((((user.preferences as Record<string, unknown>) ?? {})[partnerId] as Record<string, unknown>) ?? {}),
              sessionDuration: days,
            },
          },
        });
        setUser(updated);
      } catch (error) {
        console.error("Failed to save session duration preference:", error);
        // Revert optimistic update so UI stays consistent with server state
        setSessionDays(previous);
        setSessionDurationDays(previous, partnerId);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="flex h-[470px] flex-col">
      <ModalHeader showBackButton={true} showCloseButton={false} title="Stay signed in" handleBack={navigateBack} />

      <div className="flex flex-col gap-2 p-5">
        {SESSION_DURATION_OPTIONS.map(days => (
          <button
            type="button"
            key={days}
            onClick={() => handleSelect(days)}
            disabled={saving}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
              sessionDays === days
                ? "border-[#3f3f46] bg-[#f4f4f5] dark:border-white dark:bg-white/10"
                : "border-[#e4e4e7] bg-transparent hover:bg-[#f4f4f5] dark:border-white/10 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-neue-montreal-semibold text-[14px] leading-none tracking-[-0.28px] text-[#3f3f46] dark:text-white">
                {SESSION_DURATION_LABELS[days]}
              </span>
              <span className="font-neue-montreal-medium text-[13px] leading-none tracking-[-0.26px] text-[#70707b] dark:text-white/50">
                {DESCRIPTIONS[days]}
              </span>
            </div>
            {sessionDays === days && (
              <div className="flex size-5 items-center justify-center rounded-full bg-[#3f3f46] dark:bg-white">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="dark:stroke-[#3f3f46]"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SessionDurationContent;
