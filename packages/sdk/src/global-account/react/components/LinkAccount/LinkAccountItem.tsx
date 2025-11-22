import { Button, toast } from "@b3dotfun/sdk/global-account/react";
import { truncateAddress } from "@b3dotfun/sdk/shared/utils/truncateAddress";
import { Copy, Loader2, UnlinkIcon } from "lucide-react";
import { useB3Profile } from "../../hooks/useB3Profile";

// Helper function to check if a string is a wallet address and format it
const formatProfileTitle = (title: string): { displayTitle: string; isAddress: boolean } => {
  // Check if title looks like an Ethereum address (0x followed by 40 hex characters)
  const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(title);

  if (isEthereumAddress) {
    return {
      displayTitle: truncateAddress(title),
      isAddress: true,
    };
  }

  return {
    displayTitle: title,
    isAddress: false,
  };
};

interface LinkAccountItemProps {
  profile: {
    title: string;
    imageUrl?: string | null;
    initial: string;
    type: string;
    subtitle: string;
    originalProfile: any;
  };
  profileToUnlink: any;
  unlinkingAccountId: string | null;
  isUnlinking: boolean;
  onUnlinkClick: (profile: any) => void;
}

const LinkAccountItem = ({
  profile,
  profileToUnlink,
  unlinkingAccountId,
  isUnlinking,
  onUnlinkClick,
}: LinkAccountItemProps) => {
  const { displayTitle, isAddress } = formatProfileTitle(profile.title);
  const { data: profileData } = useB3Profile(profile.title);

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(profile.title);
      toast.success("Address copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const displayImageUrl = profileData?.avatar || profile.imageUrl;
  const displayName = profileData?.name || displayTitle;

  return (
    <div className="linked-account-item hover:bg-b3-line group flex cursor-pointer items-center justify-between rounded-xl p-4 transition-colors">
      <div className="linked-account-info flex items-center gap-3">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={profile.title}
            className="linked-account-avatar linked-account-avatar-image size-10 rounded-full"
          />
        ) : (
          <div className="linked-account-avatar linked-account-avatar-placeholder bg-b3-primary-wash flex h-10 w-10 items-center justify-center rounded-full">
            <span className="linked-account-initial text-b3-grey font-neue-montreal-semibold text-sm uppercase">
              {profile.initial}
            </span>
          </div>
        )}
        <div className="linked-account-details">
          <div className="linked-account-title-row flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span
                className={`linked-account-title text-b3-grey font-neue-montreal-semibold ${
                  isAddress
                    ? "font-mono text-sm" // Use monospace font for addresses
                    : "break-words" // Use break-words for emails/names (better than break-all)
                }`}
                title={isAddress ? profile.title : undefined} // Show full address on hover
              >
                {displayName}
              </span>
              {isAddress && (
                <button
                  onClick={handleCopyAddress}
                  className="linked-account-copy-button ml-1 rounded p-1 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                  title="Copy full address"
                >
                  <Copy size={12} className="text-gray-500 hover:text-gray-700" />
                </button>
              )}
            </div>
            <span className="linked-account-type text-b3-foreground-muted font-neue-montreal-medium bg-b3-primary-wash rounded px-2 py-0.5 text-xs">
              {profile.type.toUpperCase()}
            </span>
          </div>
          <div className="linked-account-subtitle text-b3-foreground-muted font-neue-montreal-medium text-sm">
            {profile.subtitle}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size={profileToUnlink?.title === profile.title ? "sm" : "icon"}
        className={`linked-account-unlink-button transition-all ${
          profileToUnlink?.title === profile.title
            ? "bg-b3-negative hover:bg-b3-negative/90 text-white"
            : "text-b3-grey hover:text-b3-negative"
        }`}
        onClick={() => onUnlinkClick(profile)}
        disabled={unlinkingAccountId === profile.title || isUnlinking}
      >
        {unlinkingAccountId === profile.title || isUnlinking ? (
          <Loader2 className="linked-account-unlink-loading h-4 w-4 animate-spin" />
        ) : profileToUnlink?.title === profile.title ? (
          <div className="flex items-center gap-1.5">
            <UnlinkIcon size={14} className="linked-account-unlink-icon" />
            <span className="text-xs font-semibold">Unlink</span>
          </div>
        ) : (
          <UnlinkIcon size={16} className="linked-account-unlink-icon" />
        )}
      </Button>
    </div>
  );
};

export default LinkAccountItem;
