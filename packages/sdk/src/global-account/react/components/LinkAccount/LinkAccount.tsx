import app from "@b3dotfun/sdk/global-account/app";
import {
  Button,
  ManageAccountModalProps,
  toast,
  useB3,
  useModalStore,
  useQueryB3,
} from "@b3dotfun/sdk/global-account/react";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { truncateAddress } from "@b3dotfun/sdk/shared/utils/truncateAddress";
import { Copy, Loader2, Pencil, UnlinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useProfiles, useUnlinkProfile } from "thirdweb/react";

import { Chain } from "thirdweb";
import { getProfileDisplayInfo } from "../../utils/profileDisplay";

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

import { Referrals, Users } from "@b3dotfun/b3-api";
import ModalHeader from "../ModalHeader/ModalHeader";

export const LinkAccount = ({
  partnerId,
  onLogout,
  chain,
}: {
  partnerId: string;
  onLogout?: () => void;
  chain: Chain;
}) => {
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);
  const [profileToUnlink, setProfileToUnlink] = useState<any>(null);
  const { data: profilesRaw = [], isLoading: isLoadingProfiles } = useProfiles({ client });
  const { mutate: unlinkProfile, isPending: isUnlinking } = useUnlinkProfile();
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const isLinking = useModalStore(state => state.isLinking);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const contentType = useModalStore(state => state.contentType);
  const { user, setUser } = useB3();
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const referallCodeRef = useRef<HTMLInputElement>(null);
  const { data: referrals, isLoading: isLoadingReferrals } = useQueryB3(
    "referrals",
    "find",
    { query: { referrerId: user?.userId } },
    !!user?.userId,
  );
  const showReferralInfo = (contentType as ManageAccountModalProps)?.showReferralInfo ?? false;

  const mutationOptions = {
    onError: (error: Error) => {
      console.error("Error Unlinking account:", error);
      toast.error(error.message);
    },
    onSuccess: async (data: any) => {
      console.log("Raw Link Account Data:", data);
      try {
        console.log("Sync user data...");
        await app.service("users").syncTwProfiles({});
      } catch (refreshError) {
        console.warn("⚠️ Could not sync user data:", refreshError);
      }
    },
  };

  // Fetch referred users
  const currentReferralCode = user?.referralCode || user?.userId || "";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentReferralCode);
      toast.success("Referral code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy referral code");
    }
  };

  const handleUpdateReferralCode = async () => {
    if (!newReferralCode) return;

    setIsUpdatingCode(true);
    try {
      // @ts-expect-error - setReferralCode is not typed for some reason
      const newUser = await app.service("users").setReferralCode({
        userId: user?.userId,
        referralCode: newReferralCode,
      });
      setUser(newUser as unknown as Users);
      toast.success("Referral code updated successfully!");
      setIsEditingCode(false);
      setNewReferralCode("");
    } catch (error) {
      toast.error("Failed to update referral code");
    } finally {
      setIsUpdatingCode(false);
    }
  };

  const profiles = profilesRaw
    .filter((profile: any) => !["custom_auth_endpoint"].includes(profile.type))
    .map((profile: any) => ({
      ...getProfileDisplayInfo(profile),
      originalProfile: profile,
    }));
  console.log("profiles :", profiles);

  // Reset confirmation state after 3 seconds
  useEffect(() => {
    if (profileToUnlink) {
      const timer = setTimeout(() => {
        setProfileToUnlink(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [profileToUnlink]);

  const handleUnlinkClick = (profile: any) => {
    // If this profile is already pending confirmation, perform the unlink
    if (profileToUnlink?.title === profile.title) {
      setUnlinkingAccountId(profile.title);
      try {
        unlinkProfile({ client, profileToUnlink: profile.originalProfile }, mutationOptions);
      } catch (error) {
        console.error("Error unlinking account:", error);
      } finally {
        setUnlinkingAccountId(null);
        setProfileToUnlink(null);
      }
    } else {
      // First click - set pending confirmation
      setProfileToUnlink(profile);
    }
  };

  const handleOpenLinkModal = () => {
    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "linkNewAccount",
      partnerId,
      chain,
      onSuccess: async () => {
        // Let the LinkAccount component handle modal closing
      },
      onError: () => {
        // Let the LinkAccount component handle errors
      },
      onClose: () => {
        // Let the LinkAccount component handle closing
      },
    });
  };

  return (
    <div className="linked-accounts-settings">
      <ModalHeader title="Linked Accounts" />
      {/* Linked Accounts Section */}
      <div className="linked-accounts-section space-y-4 p-5">
        {isLoadingProfiles ? (
          <div className="linked-accounts-loading flex justify-center py-8">
            <Loader2 className="text-b3-grey animate-spin" />
          </div>
        ) : profiles.length > 0 ? (
          <div className="linked-accounts-list space-y-4">
            {profiles.map(profile => (
              <div
                key={profile.title}
                className="linked-account-item hover:bg-b3-line group flex cursor-pointer items-center justify-between rounded-xl p-4 transition-colors"
              >
                <div className="linked-account-info flex items-center gap-3">
                  {profile.imageUrl ? (
                    <img
                      src={profile.imageUrl}
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
                      {(() => {
                        const { displayTitle, isAddress } = formatProfileTitle(profile.title);

                        const handleCopyAddress = async (e: React.MouseEvent) => {
                          e.stopPropagation();
                          try {
                            await navigator.clipboard.writeText(profile.title);
                            toast.success("Address copied to clipboard!");
                          } catch (error) {
                            toast.error("Failed to copy address");
                          }
                        };

                        return (
                          <div className="flex items-center gap-1">
                            <span
                              className={`linked-account-title text-b3-grey font-neue-montreal-semibold ${
                                isAddress
                                  ? "font-mono text-sm" // Use monospace font for addresses
                                  : "break-words" // Use break-words for emails/names (better than break-all)
                              }`}
                              title={isAddress ? profile.title : undefined} // Show full address on hover
                            >
                              {displayTitle}
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
                        );
                      })()}
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
                  onClick={() => handleUnlinkClick(profile)}
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
            ))}
          </div>
        ) : (
          <div className="linked-accounts-empty font-neue-montreal-medium text-b3-foreground-muted py-8 text-center">
            No linked accounts found
          </div>
        )}

        {/* Link New Account Button */}
        <Button
          onClick={handleOpenLinkModal}
          disabled={isLinking}
          className="b3-modal-link-new-account-button bg-b3-primary-blue hover:bg-b3-primary-blue/90 border-white/12 group relative h-12 w-full rounded-xl border-2 px-[18px] text-base font-semibold text-white shadow-[inset_0px_0px_0px_1px_rgba(10,13,18,0.18),inset_0px_-2px_0px_0px_rgba(10,13,18,0.05)] transition-all"
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M10.0001 13.3333V6.66667M6.66675 10H13.3334M18.3334 10C18.3334 14.6024 14.6025 18.3333 10.0001 18.3333C5.39771 18.3333 1.66675 14.6024 1.66675 10C1.66675 5.39763 5.39771 1.66667 10.0001 1.66667C14.6025 1.66667 18.3334 5.39763 18.3334 10Z"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Link new account</span>
          </div>
        </Button>
      </div>

      {showReferralInfo && (
        /* Referral Section */
        <div className="referrals-section space-y-4">
          <h3 className="referrals-title text-b3-grey font-neue-montreal-semibold text-xl">Referrals</h3>

          {/* Referral Code */}
          <div className="referral-code-container bg-b3-line rounded-xl p-4">
            {isEditingCode && (
              <div className="referral-code-header-editing">
                <div className="referral-code-title text-b3-grey font-neue-montreal-semibold">Your Referral Code</div>
                <div className="referral-code-description text-b3-foreground-muted font-neue-montreal-medium text-sm">
                  Share this code with friends to earn rewards
                </div>
              </div>
            )}
            <div className="referral-code-content flex items-center justify-between">
              {!isEditingCode && (
                <div className="referral-code-header">
                  <div className="referral-code-title text-b3-grey font-neue-montreal-semibold">Your Referral Code</div>
                  <div className="referral-code-description text-b3-foreground-muted font-neue-montreal-medium text-sm">
                    Share this code with friends to earn rewards
                  </div>
                </div>
              )}
              <div className="referral-code-actions flex items-center gap-2">
                {isEditingCode ? (
                  <div className="referral-code-edit-form flex items-center gap-2">
                    <input
                      type="text"
                      value={newReferralCode}
                      onChange={e => setNewReferralCode(e.target.value)}
                      className="referral-code-input rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
                      placeholder="Enter new code"
                      ref={referallCodeRef}
                    />
                    <Button
                      size="sm"
                      className="referral-code-save-button"
                      onClick={handleUpdateReferralCode}
                      disabled={isUpdatingCode || !newReferralCode}
                    >
                      {isUpdatingCode ? (
                        <Loader2 className="referral-code-save-loading h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="referral-code-cancel-button"
                      onClick={() => {
                        setIsEditingCode(false);
                        setNewReferralCode("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="referral-code-display rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
                      {currentReferralCode}
                    </div>
                    <Button size="icon" variant="ghost" className="referral-code-copy-button" onClick={handleCopyCode}>
                      <Copy className="referral-code-copy-icon h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="referral-code-edit-button"
                      onClick={() => {
                        setIsEditingCode(true);
                        setTimeout(() => {
                          referallCodeRef.current?.focus();
                        }, 100);
                      }}
                    >
                      <Pencil className="referral-code-edit-icon h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Referred Users */}
          <div className="referred-users-container bg-b3-line rounded-xl p-4">
            <div className="referred-users-title text-b3-grey font-neue-montreal-semibold mb-4">Referred Users</div>
            {isLoadingReferrals ? (
              <div className="referred-users-loading flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : referrals?.data?.length ? (
              <div className="referred-users-list space-y-3">
                {referrals.data.map((referral: Referrals) => (
                  <div
                    key={String(referral._id)}
                    className="referred-user-item flex items-center justify-between rounded-lg bg-white p-3"
                  >
                    <div className="referred-user-id text-sm font-medium">{referral.referreeId}</div>
                    <div className="referred-user-date text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="referred-users-empty py-4 text-center text-gray-500">No referred users yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
