import {
  useAccountWallet,
  useAuthentication,
  useB3Config,
  useModalStore,
  useProfile,
  useSimBalance,
} from "@b3dotfun/sdk/global-account/react";
import { formatUsername } from "@b3dotfun/sdk/shared/utils";
import { formatDisplayNumber } from "@b3dotfun/sdk/shared/utils/number";
import { Pencil } from "lucide-react";
import { useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useFirstEOA } from "../../hooks/useFirstEOA";
import { IPFSMediaRenderer } from "../IPFSMediaRenderer/IPFSMediaRenderer";

const ProfileSection = () => {
  const account = useActiveAccount();
  const { address: eoaAddress } = useFirstEOA();
  const { address: smartWalletAddress } = useAccountWallet();
  const { data: profile } = useProfile({
    address: eoaAddress || account?.address,
    fresh: true,
  });
  const { partnerId } = useB3Config();
  const { user } = useAuthentication(partnerId);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const navigateBack = useModalStore(state => state.navigateBack);

  const { data: simBalance } = useSimBalance(smartWalletAddress);

  // Calculate total balance in USD
  const totalBalanceUsd = useMemo(() => {
    if (!simBalance?.balances) return 0;
    return simBalance.balances.reduce((sum, token) => sum + (token.value_usd || 0), 0);
  }, [simBalance]);

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

  // IPFSMediaRenderer will handle IPFS URL conversion and validation
  const avatarSrc = user?.avatar || profile?.avatar;

  // Get current username - prioritize user.username, fallback to profile data
  const currentUsername = user?.username || profile?.displayName || formatUsername(profile?.name || "");

  return (
    <div className="flex items-center justify-between px-5 py-6">
      <div className="global-account-profile flex items-center gap-4">
        <div className="global-account-profile-avatar relative">
          <IPFSMediaRenderer
            src={avatarSrc}
            alt="Profile Avatar"
            className="border-b3-line border-1 bg-b3-primary-wash size-14 rounded-full border"
          />

          <button
            onClick={handleEditAvatar}
            className="border-b3-background hover:bg-b3-grey/80 absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-4 bg-[#a0a0ab] transition-colors"
          >
            <Pencil size={10} className="text-b3-background" />
          </button>
        </div>
        <div className="global-account-profile-info flex flex-col gap-1">
          <h2 className="text-b3-grey font-neue-montreal-semibold flex h-[38px] items-center gap-1 text-xl">
            <div className="text-b3-foreground-muted"> $</div>
            <div className="text-[30px]">{formatDisplayNumber(totalBalanceUsd, { fractionDigits: 2 })}</div>
          </h2>
          <div className="b3-modal-username font-neue-montreal-semibold text-base leading-none text-[#0B57C2]">
            {currentUsername}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
