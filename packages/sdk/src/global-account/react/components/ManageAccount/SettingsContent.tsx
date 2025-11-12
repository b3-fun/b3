import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { Chain } from "thirdweb";
import LinkIcon from "../icons/LinkIcon";
import ModalHeader from "../ModalHeader/ModalHeader";
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

  const handleNavigate = (type: "home" | "swap" | "linkAccount" | "avatarEditor") => {
    if (type === "home") {
      setB3ModalContentType({
        type: "manageAccount",
        chain,
        partnerId,
        onLogout,
        activeTab: "home",
      });
    } else if (type === "swap") {
      setB3ModalContentType({
        type: "manageAccount",
        chain,
        partnerId,
        onLogout,
        activeTab: "tokens",
      });
    } else if (type === "linkAccount") {
      setB3ModalContentType({
        type: "linkAccount",
        chain,
        partnerId,
      });
    } else {
      setB3ModalContentType({
        type: "avatarEditor",
      });
    }
    setB3ModalOpen(true);
  };

  return (
    <div className="flex h-[470px] flex-col">
      <ModalHeader title="Settings" />

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
