"use client";

import { toast, useProfile } from "@b3dotfun/sdk/global-account/react";
import { useRPMToken } from "@b3dotfun/sdk/global-account/react/hooks/useRPMToken";
import { updateAvatar } from "@b3dotfun/sdk/global-account/react/utils/updateAvatar";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import {
  AvatarCreatorConfig,
  AvatarCreator as AvatarCreatorRPM,
  AvatarExportedEvent,
} from "@readyplayerme/react-avatar-creator";
import { useState } from "react";

import { useActiveAccount } from "thirdweb/react";

const debug = debugB3React("AvatarCreator");

const config: AvatarCreatorConfig = {
  clearCache: true,
  bodyType: "fullbody",
  quickStart: true,
  language: "en",
};

interface AvatarCreatorProps {
  onSetAvatar?: () => void;
  className?: string;
}

export function AvatarCreator({ onSetAvatar, className }: AvatarCreatorProps) {
  const { token, refetch: refetchRPMToken } = useRPMToken();
  const [loading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const { data: profile, refetch: refreshProfile } = useProfile({
    address: account?.address,
    fresh: true,
  });

  const hasAvatar = profile?.avatar;

  const handleOnAvatarExported = async (event: AvatarExportedEvent) => {
    setIsLoading(true);
    debug("@@AvatarExportedEvent", event);
    try {
      const avatarUpload = await updateAvatar(event.data.url);
      debug("@@avatarUpload", avatarUpload);

      await refreshProfile();
      toast.success(
        hasAvatar ? "Nice look! Your avatar has been updated!" : "Looks great! Your avatar has been saved!",
      );
      onSetAvatar?.();
      await refetchRPMToken(undefined);
    } catch (e) {
      debug("@@error:AvatarCreator", e);
      toast.error("Failed to update avatar. Please try again.");
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm font-medium">Saving your avatar</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm font-medium">Loading avatar creator</p>
      </div>
    );
  }

  return (
    <div className={cn("h-[calc(90vh-2px)] w-full", className)}>
      <AvatarCreatorRPM
        className="h-full w-full"
        subdomain="b3"
        config={{ ...config, token }}
        onAvatarExported={handleOnAvatarExported}
      />
    </div>
  );
}
