import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Chain } from "thirdweb";
import LinkIcon from "../icons/LinkIcon";
import SettingsMenuItem from "./SettingsMenuItem";
import SettingsProfileCard from "./SettingsProfileCard";

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
  const contentType = useModalStore(state => state.contentType);

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
    <div className="flex h-[470px] flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#e4e4e7] bg-white px-5 py-3">
        <p className="font-inter text-lg font-semibold leading-7 text-[#18181b]">Settings</p>
      </div>

      {/* Profile Section */}
      <div className="p-5">
        <div className="flex items-center rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] p-4">
          <SettingsProfileCard />
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
        {/* <SettingsMenuItem
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
        /> */}
      </div>
    </div>
  );
};

export default SettingsContent;
