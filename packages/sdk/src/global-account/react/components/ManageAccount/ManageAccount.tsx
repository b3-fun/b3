import {
  ManageAccountModalProps,
  TabsContentPrimitive,
  TabsPrimitive,
  useModalStore,
} from "@b3dotfun/sdk/global-account/react";
import { Chain } from "thirdweb";

import BottomNavigation from "./BottomNavigation";
import { HomeContent } from "./HomeContent";
import SettingsContent from "./SettingsContent";

type TabValue = "home" | "tokens" | "nfts" | "apps" | "settings" | "swap";

// Unused icon components - kept for potential future use
// const HomeIcon = ({ className: _className, size: _size = 24 }: { className?: string; size?: number }) => {
//   return (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path
//         fill-rule="evenodd"
//         clip-rule="evenodd"
//         d="M12.5227 1.33636C12.1804 1.24368 11.8196 1.24368 11.4773 1.33636C11.08 1.44395 10.7454 1.7066 10.4784 1.91623L10.4038 1.97465L3.54376 7.31012C3.16713 7.6024 2.83532 7.85991 2.58806 8.19421C2.37107 8.48759 2.20942 8.8181 2.11106 9.1695C1.99898 9.56992 1.99943 9.98993 1.99995 10.4667L2.00002 17.8385C2 18.3657 1.99998 18.8204 2.03059 19.195C2.06289 19.5904 2.1342 19.9836 2.327 20.362C2.61462 20.9264 3.07356 21.3854 3.63805 21.673C4.01643 21.8658 4.40964 21.9371 4.80499 21.9694C5.17956 22 5.63431 22 6.16145 22H17.8386C18.3657 22 18.8205 22 19.195 21.9694C19.5904 21.9371 19.9836 21.8658 20.362 21.673C20.9265 21.3854 21.3854 20.9264 21.673 20.362C21.8658 19.9836 21.9371 19.5904 21.9694 19.195C22.0001 18.8204 22 18.3657 22 17.8386L22.0001 10.4667C22.0006 9.98993 22.0011 9.56992 21.889 9.1695C21.7906 8.8181 21.629 8.48759 21.412 8.19421C21.1647 7.8599 20.8329 7.6024 20.4563 7.31011L13.5963 1.97465L13.5216 1.91623C13.2546 1.7066 12.9201 1.44395 12.5227 1.33636ZM8.00003 16C7.44775 16 7.00003 16.4477 7.00003 17C7.00003 17.5523 7.44775 18 8.00003 18H16C16.5523 18 17 17.5523 17 17C17 16.4477 16.5523 16 16 16H8.00003Z"
//         fill="currentColor"
//       />
//     </svg>
//   );
// };

// const SwapIcon = ({ className: _className, size: _size = 24 }: { className?: string; size?: number }) => {
//   return (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path
//         d="M20.4533 12.893C20.1755 15.5029 18.6968 17.9487 16.2498 19.3614C12.1843 21.7086 6.98576 20.3157 4.63855 16.2502L4.38855 15.8172M3.5465 11.107C3.8243 8.49711 5.30309 6.05138 7.75007 4.63862C11.8156 2.29141 17.0141 3.68434 19.3613 7.74983L19.6113 8.18285M3.49353 18.0661L4.22558 15.334L6.95763 16.0661M17.0428 7.93401L19.7748 8.66606L20.5069 5.93401"
//         stroke="currentColor"
//         stroke-width="2"
//         stroke-linecap="round"
//         stroke-linejoin="round"
//       />
//     </svg>
//   );
// };

// const SettingsIcon = ({ className: _className, size: _size = 24 }: { className?: string; size?: number }) => {
//   return (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path
//         fill-rule="evenodd"
//         clip-rule="evenodd"
//         d="M19.286 15.9606C19.2272 15.6362 19.2669 15.3016 19.4 15C19.5268 14.7042 19.7372 14.452 20.0055 14.2743C20.2738 14.0966 20.5882 14.0013 20.91 14H21C21.5304 14 22.0391 13.7893 22.4142 13.4142C22.7893 13.0391 23 12.5304 23 12C23 11.4696 22.7893 10.9609 22.4142 10.5858C22.0391 10.2107 21.5304 10 21 10H20.83C20.5082 9.99872 20.1938 9.90337 19.9255 9.72569C19.6572 9.54802 19.4468 9.29577 19.32 9V8.92C19.1869 8.61838 19.1472 8.28381 19.206 7.95941C19.2648 7.63502 19.4195 7.33568 19.65 7.1L19.71 7.04C19.896 6.85425 20.0435 6.63368 20.1441 6.39088C20.2448 6.14808 20.2966 5.88783 20.2966 5.625C20.2966 5.36217 20.2448 5.10192 20.1441 4.85912C20.0435 4.61632 19.896 4.39575 19.71 4.21C19.5243 4.02405 19.3037 3.87653 19.0609 3.77588C18.8181 3.67523 18.5578 3.62343 18.295 3.62343C18.0322 3.62343 17.7719 3.67523 17.5291 3.77588C17.2863 3.87653 17.0657 4.02405 16.88 4.21L16.82 4.27C16.5843 4.50054 16.285 4.65519 15.9606 4.714C15.6362 4.77282 15.3016 4.73312 15 4.6C14.7042 4.47324 14.452 4.26276 14.2743 3.99447C14.0966 3.72618 14.0013 3.41179 14 3.09V3C14 2.46957 13.7893 1.96086 13.4142 1.58579C13.0391 1.21071 12.5304 1 12 1C11.4696 1 10.9609 1.21071 10.5858 1.58579C10.2107 1.96086 10 2.46957 10 3V3.17C9.99872 3.49179 9.90337 3.80618 9.72569 4.07447C9.54802 4.34276 9.29577 4.55324 9 4.68H8.92C8.61838 4.81312 8.28381 4.85282 7.95941 4.794C7.63502 4.73519 7.33568 4.58054 7.1 4.35L7.04 4.29C6.85425 4.10405 6.63368 3.95653 6.39088 3.85588C6.14808 3.75523 5.88783 3.70343 5.625 3.70343C5.36217 3.70343 5.10192 3.75523 4.85912 3.85588C4.61632 3.95653 4.39575 4.10405 4.21 4.29C4.02405 4.47575 3.87653 4.69632 3.77588 4.93912C3.67523 5.18192 3.62343 5.44217 3.62343 5.705C3.62343 5.96783 3.67523 6.22808 3.77588 6.47088C3.87653 6.71368 4.02405 6.93425 4.21 7.12L4.27 7.18C4.50054 7.41568 4.65519 7.71502 4.714 8.03941C4.77282 8.36381 4.73312 8.69838 4.6 9C4.48572 9.31074 4.28059 9.5799 4.0113 9.77251C3.742 9.96512 3.42099 10.0723 3.09 10.08H3C2.46957 10.08 1.96086 10.2907 1.58579 10.6658C1.21071 11.0409 1 11.5496 1 12.08C1 12.6104 1.21071 13.1191 1.58579 13.4942C1.96086 13.8693 2.46957 14.08 3 14.08H3.17C3.49179 14.0813 3.80618 14.1766 4.07447 14.3543C4.34276 14.532 4.55324 14.7842 4.68 15.08C4.81312 15.3816 4.85282 15.7162 4.794 16.0406C4.73519 16.365 4.58054 16.6643 4.35 16.9L4.29 16.96C4.10405 17.1457 3.95653 17.3663 3.85588 17.6091C3.75523 17.8519 3.70343 18.1122 3.70343 18.375C3.70343 18.6378 3.75523 18.8981 3.85588 19.1409C3.95653 19.3837 4.10405 19.6043 4.29 19.79C4.47575 19.976 4.69632 20.1235 4.93912 20.2241C5.18192 20.3248 5.44217 20.3766 5.705 20.3766C5.96783 20.3766 6.22808 20.3248 6.47088 20.2241C6.71368 20.1235 6.93425 19.976 7.12 19.79L7.18 19.73C7.41568 19.4995 7.71502 19.3448 8.03941 19.286C8.36381 19.2272 8.69838 19.2669 9 19.4C9.31074 19.5143 9.5799 19.7194 9.77251 19.9887C9.96512 20.258 10.0723 20.579 10.08 20.91V21C10.08 21.5304 10.2907 22.0391 10.6658 22.4142C11.0409 22.7893 11.5496 23 12.08 23C12.6104 23 13.1191 22.7893 13.4942 22.4142C13.8693 22.0391 14.08 21.5304 14.08 21V20.83C14.0813 20.5082 14.1766 20.1938 14.3543 19.9255C14.532 19.6572 14.7842 19.4468 15.08 19.32C15.3816 19.1869 15.7162 19.1472 16.0406 19.206C16.365 19.2648 16.6643 19.4195 16.9 19.65L16.96 19.71C17.1457 19.896 17.3663 20.0435 17.6091 20.1441C17.8519 20.2448 18.1122 20.2966 18.375 20.2966C18.6378 20.2966 18.8981 20.2448 19.1409 20.1441C19.3837 20.0435 19.6043 19.896 19.79 19.71C19.976 19.5243 20.1235 19.3037 20.2241 19.0609C20.3248 18.8181 20.3766 18.5578 20.3766 18.295C20.3766 18.0322 20.3248 17.7719 20.2241 17.5291C20.1235 17.2863 19.976 17.0657 19.79 16.88L19.73 16.82C19.4995 16.5843 19.3448 16.285 19.286 15.9606ZM15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
//         fill="currentColor"
//       />
//     </svg>
//   );
// };

interface ManageAccountProps {
  onLogout?: () => void;
  onSwap?: () => void;
  onDeposit?: () => void;
  onViewProfile?: () => void;
  chain: Chain;
  partnerId: string;
  containerClassName?: string;
  showSwap?: boolean;
  showDeposit?: boolean;
}

export function ManageAccount({
  onLogout,
  onSwap: _onSwap,
  onDeposit: _onDeposit,
  chain,
  partnerId,
  showSwap,
  showDeposit,
}: ManageAccountProps) {
  const contentType = useModalStore(state => state.contentType);
  const { activeTab = "home", setActiveTab } = contentType as ManageAccountModalProps;
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  return (
    <div className="b3-manage-account flex-1">
      <TabsPrimitive
        defaultValue={activeTab}
        onValueChange={value => {
          const tab = value as TabValue;
          if (tab === "swap") {
            setB3ModalContentType({
              type: "anySpend",
              showBackButton: true,
            });
          } else if (["home", "tokens", "nfts", "apps", "settings"].includes(tab)) {
            setActiveTab?.(tab);
          }
        }}
      >
        <div className="p-0">
          <TabsContentPrimitive value="home" className="m-0 p-0 pb-2">
            <HomeContent showDeposit={showDeposit} showSwap={showSwap} />
          </TabsContentPrimitive>

          {/* <TabsContentPrimitive value="tokens" className="px-0 pb-4 pt-2">
            <ContentTokens activeTab={activeTab} />
          </TabsContentPrimitive> */}

          {/* <TabsContentPrimitive value="apps" className="px-4 pb-4 pt-2">
            <AppsContent chain={chain} partnerId={partnerId} />
          </TabsContentPrimitive> */}

          {/* Swap tab content is handled by modal, so this is empty */}
          <TabsContentPrimitive value="swap" className="hidden" />

          <TabsContentPrimitive value="settings" className="m-0 p-0 pb-2">
            <SettingsContent partnerId={partnerId} onLogout={onLogout} chain={chain} />
          </TabsContentPrimitive>
        </div>
        <BottomNavigation />
      </TabsPrimitive>
    </div>
  );
}
