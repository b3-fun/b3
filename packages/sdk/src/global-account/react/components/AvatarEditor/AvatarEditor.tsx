"use client";

import app from "@b3dotfun/sdk/global-account/app";
import { Button, IPFSMediaRenderer, toast, useB3, useProfile } from "@b3dotfun/sdk/global-account/react";
import { validateImageUrl } from "@b3dotfun/sdk/global-account/react/utils/profileDisplay";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { useActiveAccount } from "thirdweb/react";
import { upload } from "thirdweb/storage";
import { useProfileSettings } from "../../hooks/useProfile";
import { useModalStore } from "../../stores";
import ModalHeader from "../ModalHeader/ModalHeader";

const debug = debugB3React("AvatarEditor");

// Helper function to create an image element from a URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", error => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

interface AvatarEditorProps {
  onSetAvatar?: () => void;
  className?: string;
}

type ViewStep = "select" | "upload";

export function AvatarEditor({ onSetAvatar, className }: AvatarEditorProps) {
  const [viewStep, setViewStep] = useState<ViewStep>("select");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedProfileType, setSelectedProfileType] = useState<string | null>(null); // Track which profile was selected
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUser, user, partnerId } = useB3();
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const contentType = useModalStore(state => state.contentType);
  const { setPreference } = useProfileSettings();

  const account = useActiveAccount();
  const { data: profile, refetch: refreshProfile } = useProfile({
    address: account?.address,
    fresh: true,
  });

  // Get raw avatar URLs, convert IPFS URLs, and validate them
  const rawCurrentAvatar = user?.avatar || profile?.avatar;
  const currentAvatar = validateImageUrl(rawCurrentAvatar);
  const safePreviewUrl = validateImageUrl(previewUrl);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set canvas size to the crop area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    // Return as blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    });
  };

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
      // Clear profile type selection when uploading a new file
      setSelectedProfileType(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedAvatar(url);
    }
  };

  const handleRemovePreview = () => {
    setSelectedAvatar(currentAvatar || null);
    setSelectedProfileType(null);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Reset crop state
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleSaveChanges = async () => {
    if (!account?.address) {
      toast.error("No account connected");
      return;
    }

    setIsSaving(true);
    try {
      let fileToUpload: File | null = null;

      // If user uploaded a new file and cropped it
      if (selectedFile && previewUrl && croppedAreaPixels) {
        try {
          const croppedBlob = await createCroppedImage(previewUrl, croppedAreaPixels);
          const extension = selectedFile.name.split(".").pop() || "jpg";
          fileToUpload = new File([croppedBlob], `avatar-cropped.${extension}`, { type: "image/jpeg" });
        } catch (error) {
          debug("Error cropping image:", error);
          toast.error("Failed to crop image. Please try again.");
          setIsSaving(false);
          return;
        }
      } else if (selectedFile) {
        // Fallback if no crop was made
        fileToUpload = selectedFile;
      } else if (selectedProfileType && selectedAvatar) {
        // User selected from existing profile avatars
        // Fetch the image from the URL and convert to blob
        debug("Fetching image from social profile:", selectedAvatar);

        try {
          const response = await fetch(selectedAvatar);
          if (!response.ok) {
            throw new Error("Failed to fetch image");
          }

          const blob = await response.blob();
          debug("Fetched blob with type:", blob.type);

          // Determine the correct extension from the blob's MIME type
          // This handles URLs without extensions (like Farcaster images)
          const mimeToExtension: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/svg+xml": "svg",
          };

          const extension = blob.type ? mimeToExtension[blob.type.toLowerCase()] || "jpg" : "jpg";
          const mimeType = blob.type || `image/${extension}`;

          fileToUpload = new File([blob], `avatar-${selectedProfileType}.${extension}`, { type: mimeType });

          debug("Successfully converted social profile image to file with extension:", extension);
        } catch (fetchError) {
          debug("Error fetching social profile image:", fetchError);
          toast.error("Failed to fetch profile image. Please try uploading manually.");
          setIsSaving(false);
          return;
        }
      }

      // Upload to IPFS if we have a file
      if (fileToUpload) {
        debug("Starting upload to IPFS", fileToUpload);

        // Upload to IPFS using Thirdweb
        const ipfsUrl = await upload({
          client,
          files: [fileToUpload],
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

  const handleProfileAvatarSelect = (avatarUrl: string, profileType: string) => {
    setSelectedAvatar(avatarUrl);
    setSelectedProfileType(profileType);
    // Clear any selected file since we're selecting from profile
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
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
      // Clear profile type selection when uploading a new file
      setSelectedProfileType(null);

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

  const isLoading = isSaving;

  // Get profile avatars with validated URLs
  const profileAvatars =
    profile?.profiles
      ?.filter(p => p.avatar)
      .map(p => {
        const rawAvatarUrl = p?.avatar || "";
        const validatedUrl = validateImageUrl(rawAvatarUrl);
        return {
          type: p.type,
          avatar: validatedUrl,
          name: p.name || p.type,
        };
      })
      .filter(p => p.avatar !== null) || []; // Filter out profiles with invalid avatars

  return (
    <div className={cn("b3-modal-avatar-editor flex w-full max-w-md flex-col bg-white", className)}>
      {/* Header */}
      {viewStep === "upload" && <ModalHeader title="Upload Image" />}

      {/* Content */}
      <div className="flex flex-col items-center p-6">
        {viewStep === "select" ? (
          <>
            {/* Avatar Preview */}
            <div className="relative mb-6">
              <div className="h-32 w-32 overflow-hidden rounded-full">
                {safePreviewUrl || selectedAvatar || currentAvatar ? (
                  <IPFSMediaRenderer
                    src={safePreviewUrl || selectedAvatar || currentAvatar || ""}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-b3-primary-wash h-full w-full" />
                )}
              </div>
              {(selectedAvatar !== currentAvatar || selectedFile) && (
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
              className="font-inter mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] bg-white px-4 py-3 text-sm font-semibold text-[#18181b] shadow-sm transition-colors hover:bg-[#f4f4f5]"
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
                {profileAvatars.map((profileAvatar, index) => {
                  // Skip if avatar is null (should not happen due to filter, but TypeScript doesn't know that)
                  if (!profileAvatar.avatar) return null;

                  return (
                    <div
                      key={index}
                      className="relative"
                      onMouseEnter={() => setHoveredProfile(profileAvatar.type)}
                      onMouseLeave={() => setHoveredProfile(null)}
                    >
                      <button
                        onClick={() => handleProfileAvatarSelect(profileAvatar.avatar || "", profileAvatar.type || "")}
                        className={cn(
                          "h-16 w-16 overflow-hidden rounded-full border-2 transition-all",
                          selectedProfileType === profileAvatar.type
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
                  );
                })}
              </div>

              {/* Link More Account */}
              <button
                onClick={handleLinkMoreAccount}
                className="b3-modal-link-more-account font-inter flex items-center gap-2 text-sm font-semibold text-[#3368ef] hover:underline"
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
                  "b3-modal-upload-view mb-6 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition-colors",
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
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f4f4f5]">
                  {safePreviewUrl ? (
                    <>
                      <Cropper
                        image={safePreviewUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="rect"
                        showGrid={false}
                        style={{
                          containerStyle: {
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#f4f4f5",
                          },
                          cropAreaStyle: {
                            border: "2px solid #3368ef",
                            borderRadius: "0px",
                          },
                        }}
                      />
                      <button
                        onClick={handleRemovePreview}
                        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#51525c] text-white transition-colors hover:bg-[#71717a]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="bg-b3-primary-wash h-full w-full" />
                  )}
                </div>
                {safePreviewUrl && (
                  <div className="mt-4 flex items-center gap-3">
                    <label className="flex-shrink-0 text-sm font-semibold text-[#475467]">Zoom</label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={e => setZoom(Number(e.target.value))}
                      className="flex-1 accent-[#3368ef]"
                    />
                  </div>
                )}
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
          disabled={isLoading || (!selectedFile && !selectedProfileType)}
          className="b3-modal-save-button flex-1 rounded-xl bg-[#3368ef] text-white hover:bg-[#2952cc]"
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
