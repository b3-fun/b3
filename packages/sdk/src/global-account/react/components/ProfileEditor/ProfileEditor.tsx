"use client";

import { ens_normalize } from "@adraffy/ens-normalize";
import { Users } from "@b3dotfun/b3-api";
import app from "@b3dotfun/sdk/global-account/app";
import { Button, useB3, useProfile } from "@b3dotfun/sdk/global-account/react";
import { validateImageUrl } from "@b3dotfun/sdk/global-account/react/utils/profileDisplay";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { getIpfsUrl } from "@b3dotfun/sdk/shared/utils/ipfs";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Check, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActiveAccount } from "thirdweb/react";
import { upload } from "thirdweb/storage";

const debug = debugB3React("ProfileEditor");

interface ProfileEditorProps {
  onSuccess?: () => void;
  className?: string;
}

export function ProfileEditor({ onSuccess, className }: ProfileEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setUser } = useB3();

  const account = useActiveAccount();
  const { data: profile, refetch: refreshProfile } = useProfile({
    address: account?.address,
    fresh: true,
  });

  const rawAvatarUrl = user?.avatar ? getIpfsUrl(user?.avatar) : profile?.avatar;
  const avatarUrl = validateImageUrl(rawAvatarUrl);
  const safePreviewUrl = validateImageUrl(previewUrl);
  const hasAvatar = !!avatarUrl;
  const currentUsername = user?.username || "";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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

  const handleSave = async () => {
    // Check if there are any changes
    const hasAvatarChange = selectedFile !== null;
    const hasUsernameChange = username.trim() !== "" && username !== currentUsername;

    if (!hasAvatarChange && !hasUsernameChange) {
      toast.error("Please make at least one change");
      return;
    }

    setIsSaving(true);
    try {
      let ipfsUrl: string | undefined;

      // Upload avatar if selected
      if (hasAvatarChange && selectedFile) {
        debug("Starting upload to IPFS", selectedFile);
        setIsUploading(true);

        ipfsUrl = await upload({
          client,
          files: [selectedFile],
        });

        debug("Upload successful", ipfsUrl);
        setIsUploading(false);
      }

      // Update user profile
      let updatedUser = user as Users | undefined;

      // If both avatar and username need updating, do them sequentially
      // Update avatar first if uploaded
      if (ipfsUrl) {
        // @ts-expect-error this resolved fine, look into why expect-error needed
        updatedUser = await app.service("users").setAvatar(
          {
            avatar: ipfsUrl,
          },
          // @ts-expect-error - our typed client is expecting context even though it's set elsewhere
          {},
        );
      }

      // Update username if changed (this will use the updated user from avatar change if both were updated)
      if (hasUsernameChange && user?._id) {
        const sanitizedUsername = ens_normalize(username);
        const b3Username = `${sanitizedUsername}.b3.fun`;
        const usernameSignMessage = `Register "${b3Username}"`;
        const usernameSignature = await account?.signMessage({ message: usernameSignMessage });
        console.log("@@usernameSignature", usernameSignature);
        // TODO: same signed message to registerUsername, for ENS setting

        // @ts-expect-error this resolved fine, look into why expect-error needed
        updatedUser = await app.service("users").registerUsername(
          { username: username },
          // @ts-expect-error - our typed client is expecting context even though it's set elsewhere
          {},
        );
      }

      // Update user state
      setUser(updatedUser);

      // Refresh profile to get updated data
      await refreshProfile();

      // Show success message
      const changes = [];
      if (hasAvatarChange) changes.push("avatar");
      if (hasUsernameChange) changes.push("username");
      toast.success(`Successfully updated ${changes.join(" and ")}!`);

      onSuccess?.();

      // Clean up
      handleRemoveFile();
      setUsername("");
    } catch (error) {
      debug("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const isLoading = isUploading || isSaving;
  const hasChanges = selectedFile !== null || (username.trim() !== "" && username !== currentUsername);

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6 p-8", className)}>
      <div className="space-y-2 text-center">
        <h2 className="font-neue-montreal-semibold text-b3-grey text-2xl">Edit Your Profile</h2>
        <p className="text-b3-foreground-muted font-neue-montreal-medium">Update your avatar and username</p>
      </div>

      {/* Avatar Section */}
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-2">
          <label className="text-b3-grey font-neue-montreal-semibold text-sm">Avatar</label>

          {/* Current/Preview Avatar */}
          <div className="flex justify-center">
            {safePreviewUrl || avatarUrl ? (
              <div className="relative">
                <div className="border-b3-primary-blue h-32 w-32 overflow-hidden rounded-full border-4">
                  <img
                    src={safePreviewUrl || avatarUrl || ""}
                    alt={safePreviewUrl ? "Preview" : "Current avatar"}
                    className="h-full w-full object-cover"
                  />
                </div>
                {safePreviewUrl && (
                  <button
                    onClick={handleRemoveFile}
                    className="bg-b3-negative absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-red-600"
                    disabled={isLoading}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-b3-primary-wash h-32 w-32 rounded-full" />
            )}
          </div>

          {/* Upload Button */}
          {!selectedFile && (
            <Button variant="outline" onClick={handleFileInputClick} disabled={isLoading} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {hasAvatar ? "Change Avatar" : "Upload Avatar"}
            </Button>
          )}

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* Username Section */}
        <div className="space-y-2">
          <label htmlFor="username" className="text-b3-grey font-neue-montreal-semibold text-sm">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={currentUsername || "Enter username"}
            className="border-b3-line bg-b3-background text-b3-grey placeholder:text-b3-foreground-muted font-neue-montreal-medium focus:border-b3-primary-blue w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none"
            disabled={isLoading}
          />
          {currentUsername && (
            <p className="text-b3-foreground-muted font-neue-montreal-medium text-xs">Current: {currentUsername}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full max-w-md gap-3">
        <Button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 flex-1 text-white disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? "Uploading..." : "Saving..."}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-b3-foreground-muted font-neue-montreal-medium max-w-md text-center text-xs">
        <p>
          Your avatar will be uploaded to IPFS and stored securely. Make sure you have the rights to use this image.
        </p>
      </div>
    </div>
  );
}
