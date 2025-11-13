import app from "@b3dotfun/sdk/global-account/app";
import { useB3, useModalStore, useProfile } from "@b3dotfun/sdk/global-account/react";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActiveAccount } from "thirdweb/react";
import { useFirstEOA } from "../../hooks/useFirstEOA";
import { IPFSMediaRenderer } from "../IPFSMediaRenderer/IPFSMediaRenderer";

const SettingsProfileCard = () => {
  const account = useActiveAccount();
  const { address: eoaAddress } = useFirstEOA();
  const { data: profile, refetch: refreshProfile } = useProfile({
    address: eoaAddress || account?.address,
    fresh: true,
  });
  const { user, setUser } = useB3();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const navigateBack = useModalStore(state => state.navigateBack);

  // State for inline username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // IPFSMediaRenderer will handle IPFS URL conversion and validation
  const avatarSrc = user?.avatar || profile?.avatar;

  // Get current username - prioritize user.username, fallback to profile data
  const currentUsername = user?.username || profile?.displayName || formatUsername(profile?.name || "");

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingUsername && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingUsername]);

  const handleEditAvatar = () => {
    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "avatarEditor",
      onSuccess: () => {
        // navigate back on success
        navigateBack();
      },
    });
  };

  const handleEditUsername = () => {
    setEditedUsername(currentUsername || "");
    setIsEditingUsername(true);
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setEditedUsername("");
  };

  const handleSaveUsername = async () => {
    if (!editedUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (editedUsername === currentUsername) {
      // No change, just exit edit mode
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await app.service("users").registerUsername(
        { username: editedUsername.trim() },
        // @ts-expect-error - our typed client is expecting context even though it's set elsewhere
        {},
      );

      // Update user state - registerUsername returns an array with single user
      setUser(Array.isArray(updatedUser) ? updatedUser[0] : updatedUser);

      // Refresh profile to get updated data
      await refreshProfile();

      toast.success("Username updated successfully!");
      setIsEditingUsername(false);
      setEditedUsername("");
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveUsername();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="flex w-full items-center gap-3">
      {/* Avatar with edit badge */}
      <div className="relative shrink-0">
        <IPFSMediaRenderer
          src={avatarSrc}
          alt="Profile"
          className="border-black/8 size-14 rounded-full border object-cover"
        />
        <button
          onClick={handleEditAvatar}
          className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#a0a0ab] transition-colors hover:bg-[#a0a0ab]/80"
          aria-label="Edit avatar"
        >
          <Pencil size={10} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Username and edit link */}
      <div className="flex shrink-0 flex-col gap-1">
        {isEditingUsername ? (
          /* Edit mode - inline input */
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editedUsername}
              onChange={e => setEditedUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="border-b3-line bg-b3-background text-b3-grey placeholder:text-b3-foreground-muted font-neue-montreal-semibold focus:border-b3-primary-blue w-full rounded-md border px-2 py-1 text-lg leading-none transition-colors focus:outline-none disabled:opacity-50"
              placeholder="Enter username"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={handleSaveUsername}
                disabled={isSaving}
                className="text-b3-primary-blue hover:text-b3-primary-blue/80 flex items-center justify-center rounded-md p-1 transition-colors disabled:opacity-50"
                aria-label="Save username"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="text-b3-foreground-muted hover:text-b3-grey flex items-center justify-center rounded-md p-1 transition-colors disabled:opacity-50"
                aria-label="Cancel editing"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          /* Display mode */
          <>
            <div className="flex items-center gap-1">
              <p className="font-neue-montreal-semibold text-lg leading-none text-[#0B57C2]">{currentUsername}</p>
            </div>
            <button
              onClick={handleEditUsername}
              className="flex items-center justify-center gap-1 text-left transition-opacity hover:opacity-80"
            >
              <p className="font-inter text-sm font-semibold leading-5 text-[#51525C]">Edit Username</p>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsProfileCard;
