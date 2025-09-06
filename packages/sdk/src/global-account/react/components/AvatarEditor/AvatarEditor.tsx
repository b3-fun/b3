"use client";

import app from "@b3dotfun/sdk/global-account/app";
import { Button, useB3, useProfile } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Check, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
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
  const { setUser } = useB3();

  const account = useActiveAccount();
  const { data: profile, refetch: refreshProfile } = useProfile({
    address: account?.address,
    fresh: true,
  });

  // Thirdweb upload function

  const hasAvatar = profile?.avatar;

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

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsUploading(true);
    try {
      debug("Starting upload to IPFS", selectedFile);

      // Upload to IPFS using Thirdweb
      const ipfsUrl = await upload({
        client,
        files: [selectedFile],
      });

      debug("Upload successful", ipfsUrl);

      // Save avatar URL using profiles service
      setIsSaving(true);
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

      // Refresh profile to get updated avatar
      await refreshProfile();

      toast.success(
        hasAvatar ? "Nice look! Your avatar has been updated!" : "Looks great! Your avatar has been saved!",
      );

      onSetAvatar?.();

      // Clean up
      handleRemoveFile();
    } catch (error) {
      debug("Error uploading avatar:", error);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const isLoading = isUploading || isSaving;

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6 p-8", className)}>
      <div className="space-y-2 text-center">
        <h2 className="font-neue-montreal-semibold text-b3-grey text-2xl">
          {hasAvatar ? "Update Your Avatar" : "Set Your Avatar"}
        </h2>
        <p className="text-b3-foreground-muted font-neue-montreal-medium">
          Upload an image to personalize your profile
        </p>
      </div>

      {/* Current Avatar Display */}
      {hasAvatar && !previewUrl && (
        <div className="relative">
          <div className="border-b3-primary-blue h-32 w-32 overflow-hidden rounded-full border-4">
            <img src={profile.avatar} alt="Current avatar" className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      {/* File Upload Area */}
      <div className="w-full max-w-md">
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
            {/* Preview */}
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

            {/* File Info */}
            <div className="space-y-1 text-center">
              <p className="text-b3-grey font-neue-montreal-semibold text-sm">{selectedFile.name}</p>
              <p className="text-b3-foreground-muted font-neue-montreal-medium text-xs">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>

      {/* Action Buttons */}
      <div className="flex w-full max-w-md gap-3">
        {selectedFile && (
          <Button
            onClick={handleUpload}
            disabled={isLoading}
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
                {hasAvatar ? "Update Avatar" : "Set Avatar"}
              </>
            )}
          </Button>
        )}

        <Button variant="outline" onClick={handleFileInputClick} disabled={isLoading} className="flex-1">
          <Upload className="mr-2 h-4 w-4" />
          {selectedFile ? "Change Image" : "Select Image"}
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
