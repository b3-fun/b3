"use client";

import app from "@b3dotfun/sdk/global-account/app";
import { Button, useB3, useProfile } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { getIpfsUrl } from "@b3dotfun/sdk/shared/utils/ipfs";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActiveAccount } from "thirdweb/react";
import { upload } from "thirdweb/storage";
import { useProfileSettings } from "../../hooks/useProfile";
import { useModalStore } from "../../stores";
import ModalHeader from "../ModalHeader/ModalHeader";

const debug = debugB3React("AvatarEditor");

interface AvatarEditorProps {
  onSetAvatar?: () => void;
  className?: string;
}

type ViewStep = "select" | "upload";

export function AvatarEditor({ onSetAvatar, className }: AvatarEditorProps) {
  const [viewStep, setViewStep] = useState<ViewStep>("select");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUser, user, partnerId } = useB3();
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const contentType = useModalStore(state => state.contentType);
  const { setPreference } = useProfileSettings();

  const account = useActiveAccount();
  const { data: profile, refetch: refreshProfile } = useProfile({
    address: account?.address,
    fresh: true,
  });

  const currentAvatar = user?.avatar
    ? getIpfsUrl(user?.avatar)
    : profile?.avatar
      ? getIpfsUrl(profile.avatar)
      : undefined;

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
      setSelectedAvatar(url);
    }
  };

  const handleRemovePreview = () => {
    setSelectedAvatar(currentAvatar || null);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveChanges = async () => {
    if (!account?.address) {
      toast.error("No account connected");
      return;
    }

    setIsSaving(true);
    try {
      // If user uploaded a new file
      if (selectedFile) {
        debug("Starting upload to IPFS", selectedFile);

        // Upload to IPFS using Thirdweb
        const ipfsUrl = await upload({
          client,
          files: [selectedFile],
        });

        debug("Upload successful", ipfsUrl);

        // Save avatar URL using profiles service
        const user = await app.service("users").setAvatar(
          {
            avatar: ipfsUrl,
          },
          // @ts-expect-error - our typed client is expecting context even though it's set elsewhere
          {},
        );
        // update user
        // @ts-expect-error this resolved fine, look into why expect-error needed
        setUser(user);

        toast.success("Looks great! Your avatar has been saved!");
      } else if (selectedAvatar && selectedAvatar !== currentAvatar) {
        // User selected from existing profile avatars
        // Find the profile that matches the selected avatar
        const selectedProfile = profile?.profiles?.find(p => p.avatar === selectedAvatar);

        if (selectedProfile && selectedProfile.type) {
          debug("Setting profile preference to:", selectedProfile.type);

          // Set preference for this profile type
          await setPreference(account.address, selectedProfile.type, account.address, async (message: string) => {
            // Sign the message using the active account
            const signature = await account.signMessage({ message });
            return signature;
          });

          toast.success("Avatar updated successfully!");
        }
      }

      // Refresh profile to get updated avatar
      await refreshProfile();

      onSetAvatar?.();
    } catch (error) {
      debug("Error saving avatar:", error);
      toast.error("Failed to save avatar. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (viewStep === "upload") {
      setViewStep("select");
      handleRemovePreview();
    } else {
      setB3ModalContentType({
        type: "manageAccount",
        chain: (contentType as any)?.chain,
        partnerId: partnerId,
      });
    }
  };

  const handleProfileAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleUploadImageClick = () => {
    setViewStep("upload");
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
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
      setSelectedAvatar(url);
    }
  };

  const handleLinkMoreAccount = () => {
    setB3ModalContentType({
      type: "linkAccount",
      chain: (contentType as any)?.chain,
      partnerId: partnerId,
    });
  };

  const isLoading = isUploading || isSaving;

  // Get profile avatars
  const profileAvatars =
    profile?.profiles
      ?.filter(p => p.avatar)
      .map(p => ({
        type: p.type,
        avatar: getIpfsUrl(p.avatar!),
        name: p.name || p.type,
      })) || [];

  return (
    <div className={cn("flex w-full max-w-md flex-col bg-white", className)}>
      {/* Header */}
      {viewStep === "upload" && <ModalHeader title="Upload Image" />}

      {/* Content */}
      <div className="flex flex-col items-center p-6">
        {viewStep === "select" ? (
          <>
            {/* Avatar Preview */}
            <div className="relative mb-6">
              <div className="h-32 w-32 overflow-hidden rounded-full">
                <img
                  src={selectedAvatar || currentAvatar || "https://via.placeholder.com/128"}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              </div>
              {selectedAvatar && (
                <button
                  onClick={handleRemovePreview}
                  className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#51525c] text-white transition-colors hover:bg-[#71717a]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Upload Image Button */}
            <button
              onClick={handleUploadImageClick}
              className="font-inter shadow-xs mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] bg-white px-4 py-3 text-sm font-semibold text-[#18181b] transition-colors hover:bg-[#f4f4f5]"
            >
              <Upload className="h-4 w-4" />
              Upload image
            </button>

            {/* Select Profile Image Section */}
            <div className="w-full">
              <h3 className="mb-2 text-base font-semibold text-[#18181b]">Select your profile image</h3>
              <p className="mb-4 text-sm font-semibold text-[#475467]">
                Pick an avatar from your linked profiles, ENS or upload a new one.
              </p>

              {/* Profile Avatars */}
              <div className="mb-4 flex gap-3">
                {profileAvatars.map((profileAvatar, index) => (
                  <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setHoveredProfile(profileAvatar.type)}
                    onMouseLeave={() => setHoveredProfile(null)}
                  >
                    <button
                      onClick={() => handleProfileAvatarSelect(profileAvatar.avatar)}
                      className={cn(
                        "h-16 w-16 overflow-hidden rounded-full border-2 transition-all",
                        selectedAvatar === profileAvatar.avatar
                          ? "border-[#3368ef] ring-2 ring-[#3368ef]/20"
                          : "border-transparent hover:border-[#e4e4e7]",
                      )}
                    >
                      <img
                        src={profileAvatar.avatar}
                        alt={`${profileAvatar.type} avatar`}
                        className="h-full w-full object-cover"
                      />
                    </button>

                    {/* Tooltip */}
                    {hoveredProfile === profileAvatar.type && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#18181b] px-3 py-1.5 text-xs text-white">
                        {profileAvatar.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Link More Account */}
              <button
                onClick={handleLinkMoreAccount}
                className="font-inter flex items-center gap-2 text-sm font-semibold text-[#3368ef] hover:underline"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    d="M8.75 2.75C8.75 2.33579 8.41421 2 8 2C7.58579 2 7.25 2.33579 7.25 2.75V7.25H2.75C2.33579 7.25 2 7.58579 2 8C2 8.41421 2.33579 8.75 2.75 8.75H7.25V13.25C7.25 13.6642 7.58579 14 8 14C8.41421 14 8.75 13.6642 8.75 13.25V8.75H13.25C13.6642 8.75 14 8.41421 14 8C14 7.58579 13.6642 7.25 13.25 7.25H8.75V2.75Z"
                    fill="currentColor"
                  />
                </svg>
                Link more account
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Upload View */}
            {!selectedFile ? (
              <div
                onClick={handleOpenFilePicker}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "mb-6 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition-colors",
                  isDragging
                    ? "border-[#3368ef] bg-[#f0f5ff]"
                    : "border-[#e4e4e7] hover:border-[#3368ef] hover:bg-[#f0f5ff]",
                )}
              >
                <p className="font-inter mb-1 text-sm">
                  <span className="font-semibold text-[#3368ef]">Click to upload</span>
                  <span className="text-[#71717a]"> or drag and drop</span>
                </p>
                <p className="text-xs text-[#71717a]">PNG, JPG or GIF (up to 5MB)</p>
              </div>
            ) : (
              <div className="mb-6 w-full">
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-[#f4f4f5]">
                  <img src={previewUrl || ""} alt="Preview" className="h-full w-full object-cover" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>

      {/* Footer Buttons */}
      <div className="font-inter flex gap-3 border-t border-[#e4e4e7] p-6 font-semibold">
        <Button
          onClick={handleCancel}
          variant="outline"
          disabled={isLoading}
          className="flex-1 rounded-xl border-[#e4e4e7] text-[#18181b] hover:bg-[#f4f4f5]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveChanges}
          disabled={isLoading || !selectedAvatar}
          className="flex-1 rounded-xl bg-[#3368ef] text-white hover:bg-[#2952cc]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
  );
}
