import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Chain } from "thirdweb";
import BellIcon from "../icons/BellIcon";
import LinkIcon from "../icons/LinkIcon";
import LockIcon from "../icons/LockIcon";
import ProfileSection from "./ProfileSection";
import SettingsMenuItem from "./SettingsMenuItem";

const SettingsContent = ({
  partnerId,
  onLogout,
  chain,
}: {
  partnerId: string;
  onLogout?: () => void;
  chain: Chain;
}) => {
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);

  const handleNavigate = (type: "home" | "swap" | "linkAccount" | "avatarEditor") => {
    if (type === "home") {
      setB3ModalContentType({
        type: "manageAccount",
        showBackButton: true,
        chain,
        partnerId,
        onLogout,
        activeTab: "home",
      });
    } else if (type === "swap") {
      setB3ModalContentType({
        type: "manageAccount",
        showBackButton: true,
        chain,
        partnerId,
        onLogout,
        activeTab: "tokens",
      });
    } else if (type === "linkAccount") {
      setB3ModalContentType({
        type: "linkAccount",
        showBackButton: true,
        chain,
        partnerId,
      });
    } else {
      setB3ModalContentType({
        type: "avatarEditor",
        showBackButton: true,
      });
    }
    setB3ModalOpen(true);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b3-border border-b px-5 py-3">
        <h1 className="text-b3-grey-900 text-lg font-semibold">Settings</h1>
      </div>

      {/* Profile Section */}
      <div className="p-5">
        <div className="bg-b3-primary-wash rounded-xl p-4">
          <ProfileSection />
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3 px-5">
        <SettingsMenuItem
          icon={<LinkIcon className="text-b3-grey-500" />}
          title="Linked Accounts"
          subtitle="3 connected accounts"
          onClick={() => handleNavigate("linkAccount")}
        />
        <SettingsMenuItem
          icon={<BellIcon className="text-b3-grey-500" />}
          title="Notifications"
          subtitle="Manage your notifications"
          onClick={() => handleNavigate("avatarEditor")}
        />
        <SettingsMenuItem
          icon={<LockIcon className="text-b3-grey-500" />}
          title="Permissions"
          subtitle="Security & apps"
          onClick={() => handleNavigate("avatarEditor")}
        />
      </div>
    </div>
  );
};

export default SettingsContent;
