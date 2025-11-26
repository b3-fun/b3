import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Chain } from "thirdweb";
import { useProfiles } from "thirdweb/react";
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

  const { data: profilesRaw = [] } = useProfiles({ client });

  const profiles = profilesRaw.filter((profile: any) => !["custom_auth_endpoint"].includes(profile.type));

  const handleNavigate = (type: "home" | "swap" | "linkAccount" | "avatarEditor" | "notifications") => {
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
    } else if (type === "notifications") {
      setB3ModalContentType({
        type: "notifications",
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
      <ModalHeader showBackButton={false} showCloseButton={false} title="Settings" />

      {/* Profile Section */}
      <div className="p-5">
        <div className="b3-modal-settings-profile-card flex items-center rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] p-4">
          <SettingsProfileCard />
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3 px-5">
        <SettingsMenuItem
          icon={
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 12C0 5.37258 5.37258 0 12 0H28C34.6274 0 40 5.37258 40 12V28C40 34.6274 34.6274 40 28 40H12C5.37258 40 0 34.6274 0 28V12Z"
                fill="#F4F4F5"
              />
            </svg>
          }
          title="Linked Accounts"
          subtitle={`${profiles.length} connected account${profiles.length > 1 ? "s" : ""}`}
          onClick={() => handleNavigate("linkAccount")}
        />
        <SettingsMenuItem
          icon={
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 12C0 5.37258 5.37258 0 12 0H28C34.6274 0 40 5.37258 40 12V28C40 34.6274 34.6274 40 28 40H12C5.37258 40 0 34.6274 0 28V12Z"
                fill="#F4F4F5"
              />
            </svg>
          }
          title="Notifications"
          subtitle="Manage your notifications"
          onClick={() => handleNavigate("notifications")}
        />
      </div>
    </div>
  );
};

export default SettingsContent;
