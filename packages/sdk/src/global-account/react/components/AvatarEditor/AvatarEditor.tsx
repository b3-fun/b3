"use client";

import app from "@b3dotfun/sdk/global-account/app";
import { Button, Input, useB3, useProfile } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Check, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActiveAccount } from "thirdweb/react";
import { upload } from "thirdweb/storage";

const debug = debugB3React("AvatarEditor");

interface AvatarEditorProps {
  onSetAvatar?: () => void;
  className?: string;
}

export function AvatarEditor({ onSetAvatar, className }: AvatarEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setUser } = useB3();
  const [usernameState, setUsernameState] = useState<{ value: string; original: string }>({
    value: "",
    original: "",
  });
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const account = useActiveAccount();
  const { data: profile, refetch: refreshProfile } = useProfile({
    address: account?.address,
    fresh: true,
  });

  const hasAvatar = profile?.avatar;
  const trimmedUsername = usernameState.value.trim();
  const hasUsernameChange = trimmedUsername !== usernameState.original.trim();
  const hasAvatarChange = !!selectedFile;
  const hasPendingChanges = hasAvatarChange || hasUsernameChange;
  const isLoading = isUploading || isSaving;

  useEffect(() => {
    const nextUsername = (user?.username ?? profile?.name ?? "").trim();
    setUsernameState(prev => {
      const prevValueTrimmed = prev.value.trim();
      const prevOriginalTrimmed = prev.original.trim();

      if (prevValueTrimmed !== prevOriginalTrimmed && prevValueTrimmed !== nextUsername) {
        return {
          value: prev.value,
          original: nextUsername,
        };
      }

      return {
        value: nextUsername,
        original: nextUsername,
      };
    });
  }, [user?.username, profile?.name]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setUsernameState(prev => ({
      ...prev,
      value,
    }));
    if (usernameError) {
      setUsernameError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const validateUsername = (value: string) => {
    if (!value) {
      setUsernameError("Username cannot be empty.");
      return false;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
      setUsernameError("Usernames can include letters, numbers, underscores, periods, and dashes only.");
      return false;
    }

    return true;
  };

  const updateAvatar = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return false;
    }

    const file = selectedFile;
    setIsUploading(true);
    try {
      debug("Starting upload to IPFS", file);

      const ipfsUrl = await upload({
        client,
        files: [file],
      });

      debug("Upload successful", ipfsUrl);

      const updatedUser = await app.service("users").setAvatar(
        {
          avatar: ipfsUrl,
        },
        // @ts-expect-error - our typed client is expecting context even though it's set elsewhere
        {},
      );
      // @ts-expect-error this resolved fine, look into why expect-error needed
      setUser(updatedUser);

      toast.success(
        hasAvatar ? "Nice look! Your avatar has been updated!" : "Looks great! Your avatar has been saved!",
      );

      handleRemoveFile();
      return true;
    } catch (error) {
      debug("Error uploading avatar:", error);
      toast.error("Failed to upload avatar. Please try again.");
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const updateUsername = async (nextUsername: string) => {
    if (!user) {
      toast.error("Unable to update username. Please try again.");
      return false;
    }

    const userId =
      // @ts-expect-error - user may have _id or userId depending on source
      user?.userId || user?._id || user?.id;

    if (!userId) {
      toast.error("Unable to determine user identifier.");
      return false;
    }

    try {
      const updatedUser = await app.service("users").patch(userId, { username: nextUsername });
      // @ts-expect-error this resolved fine, look into why expect-error needed
      setUser(updatedUser);
      setUsernameState({
        value: nextUsername,
        original: nextUsername,
      });
      toast.success("Username updated!");
      return true;
    } catch (error) {
      debug("Error updating username:", error);
      toast.error("Failed to update username. Please try again.");
      return false;
    }
  };

  const handleSaveChanges = async () => {
    const normalizedUsername = trimmedUsername;
    const shouldUpdateAvatar = hasAvatarChange;
    const shouldUpdateUsername = normalizedUsername !== usernameState.original.trim();

    if (!shouldUpdateAvatar && !shouldUpdateUsername) {
      toast.info("No changes to save.");
      return;
    }

    if (shouldUpdateUsername && !validateUsername(normalizedUsername)) {
      return;
    }

    setIsSaving(true);

    try {
      let avatarUpdated = false;
      if (shouldUpdateAvatar) {
        avatarUpdated = await updateAvatar();
        if (!avatarUpdated && !shouldUpdateUsername) {
          return;
        }
      }

      let usernameUpdated = false;
      if (shouldUpdateUsername) {
        usernameUpdated = await updateUsername(normalizedUsername);
        if (!usernameUpdated) {
          if (avatarUpdated) {
            await refreshProfile();
            onSetAvatar?.();
          }
          return;
        }
      }

      if (avatarUpdated || usernameUpdated) {
        await refreshProfile();
        onSetAvatar?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsernameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey && hasPendingChanges && !isLoading && !usernameError) {
      event.preventDefault();
      handleSaveChanges();
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6 p-8", className)}>
      <div className="space-y-2 text-center">
        <h2 className="font-neue-montreal-semibold text-b3-grey text-2xl">
          {hasAvatar ? "Update Your Profile" : "Set Up Your Profile"}
        </h2>
        <p className="text-b3-foreground-muted font-neue-montreal-medium">
          Update your avatar, username, or both to personalize your profile.
        </p>
      </div>

      {hasAvatar && !previewUrl && (
        <div className="relative">
          <div className="border-b3-primary-blue h-32 w-32 overflow-hidden rounded-full border-4">
            <img src={profile.avatar} alt="Current avatar" className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-6">
        <div>
          {!selectedFile ? (
            <div
              onClick={handleFileInputClick}
              className="border-b3-line hover:border-b3-primary-blue hover:bg-b3-primary-wash/20 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors"
            >
              <Upload className="text-b3-grey mx-auto mb-4 h-12 w-12" />
              <p className="text-b3-grey font-neue-montreal-semibold mb-2">Click to select an image</p>
              <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">PNG, JPG, or GIF up to 5MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="border-b3-primary-blue mx-auto h-32 w-32 overflow-hidden rounded-full border-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="bg-b3-primary-wash flex h-full w-full items-center justify-center rounded-full">
                      <p className="text-b3-grey font-neue-montreal-semibold text-sm">No file selected</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="bg-b3-negative absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-red-600"
                  disabled={isLoading}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1 text-center">
                <p className="text-b3-grey font-neue-montreal-semibold text-sm">{selectedFile.name}</p>
                <p className="text-b3-foreground-muted font-neue-montreal-medium text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        <div className="space-y-2">
          <label className="text-b3-grey font-neue-montreal-semibold text-sm" htmlFor="username">
            Username
          </label>
          <Input
            id="username"
            value={usernameState.value}
            onChange={handleUsernameChange}
            onKeyDown={handleUsernameKeyDown}
            placeholder="Enter your username"
            disabled={isLoading}
            autoComplete="username"
          />
          {usernameError ? (
            <p className="text-b3-negative font-neue-montreal-medium text-xs" role="alert">
              {usernameError}
            </p>
          ) : (
            <p className="text-b3-foreground-muted font-neue-montreal-medium text-xs">
              Pick a unique handle. This will be visible to other users.
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="flex w-full gap-3">
          <Button
            onClick={handleSaveChanges}
            disabled={!hasPendingChanges || isLoading || !!usernameError}
            className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 flex-1 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleFileInputClick} disabled={isLoading} className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            {selectedFile ? "Change Image" : "Select Image"}
          </Button>
        </div>
        {!hasPendingChanges && (
          <p className="text-b3-foreground-muted font-neue-montreal-medium text-xs">
            Make changes above and click save when you are ready.
          </p>
        )}
      </div>

      <div className="text-b3-foreground-muted font-neue-montreal-medium max-w-md text-center text-xs">
        <p>Your avatar will be uploaded to IPFS and stored securely. Make sure you have the rights to use this image.</p>
      </div>
    </div>
  );
}
