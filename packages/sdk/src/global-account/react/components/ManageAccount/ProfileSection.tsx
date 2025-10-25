import { useB3, useModalStore, useProfile } from "@b3dotfun/sdk/global-account/react";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { getIpfsUrl } from "@b3dotfun/sdk/shared/utils/ipfs";
import { Pencil } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { useFirstEOA } from "../../hooks/useFirstEOA";

const ProfileSection = () => {
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

  const avatarUrl = user?.avatar ? getIpfsUrl(user?.avatar) : profile?.avatar;

  const handleEditAvatar = () => {
    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "avatarEditor",
      showBackButton: true,
      onSuccess: () => {
        // navigate back on success
        navigateBack();
      },
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="global-account-profile flex items-center gap-4">
        <div className="global-account-profile-avatar relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="size-14 rounded-full" />
          ) : (
            <div className="bg-b3-primary-wash size-14 rounded-full" />
          )}
          <button
            onClick={handleEditAvatar}
            className="border-b3-background hover:bg-b3-grey/80 absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-4 bg-[#a0a0ab] transition-colors"
          >
            <Pencil size={10} className="text-b3-background" />
          </button>
        </div>
        <div className="global-account-profile-info">
          <h2 className="text-b3-grey text-xl font-semibold">balance</h2>
          <div className="py-1 text-[#0B57C2]">{profile?.displayName || formatUsername(profile?.name || "")} </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
