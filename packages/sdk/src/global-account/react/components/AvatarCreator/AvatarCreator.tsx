"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";

interface AvatarCreatorProps {
  onSetAvatar?: () => void;
  className?: string;
}

export function AvatarCreator({ onSetAvatar, className }: AvatarCreatorProps) {
  return (
    <div className={cn("h-[calc(90vh-2px)] w-full", className)}>
      {/* TODO: Replace with actual avatar creator component */}
      <div className="flex h-full items-center justify-center">
        <h1>Avatar Creator - WIP</h1>
      </div>
    </div>
  );
}
