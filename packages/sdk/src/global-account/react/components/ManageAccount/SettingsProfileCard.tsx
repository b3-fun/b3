import { useB3, useModalStore, useProfile } from "@b3dotfun/sdk/global-account/react";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { Pencil } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { IPFSMediaRenderer } from "../IPFSMediaRenderer/IPFSMediaRenderer";
import { useFirstEOA } from "../../hooks/useFirstEOA";

const SettingsProfileCard = () => {
  const account = useActiveAccount();
  const { address: eoaAddress } = useFirstEOA();
  const { data: profile } = useProfile({
    address: eoaAddress || account?.address,
    fresh: true,
  });
  const { user } = useB3();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const navigateBack = useModalStore(state => state.navigateBack);

  // IPFSMediaRenderer will handle IPFS URL conversion and validation
  const avatarSrc = user?.avatar || profile?.avatar;

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
    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "profileEditor",
      onSuccess: () => {
        // navigate back on success
        navigateBack();
      },
    });
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
        <div className="flex items-center gap-1">
          <p className="font-neue-montreal-semibold text-lg leading-none text-[#0B57C2]">
            {profile?.displayName || formatUsername(profile?.name || "")}
          </p>
        </div>
        <button
          onClick={handleEditUsername}
          className="flex items-center justify-center gap-1 text-left transition-opacity hover:opacity-80"
        >
          <p className="font-inter text-sm font-semibold leading-5 text-[#51525C]">Edit Username</p>
        </button>
      </div>
    </div>
  );
};

export default SettingsProfileCard;
