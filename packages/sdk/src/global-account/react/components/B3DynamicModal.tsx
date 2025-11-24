import {
  AnySpend,
  AnySpendBondKit,
  AnySpendBuySpin,
  AnySpendCollectorClubPurchase,
  AnySpendNFT,
  AnyspendSignatureMint,
  AnySpendStakeB3,
  AnySpendStakeB3ExactIn,
  AnySpendTournament,
  OrderHistory,
} from "@b3dotfun/sdk/anyspend/react";
import { AnySpendDepositHype } from "@b3dotfun/sdk/anyspend/react/components/AnyspendDepositHype";
import { AnySpendStakeUpside } from "@b3dotfun/sdk/anyspend/react/components/AnySpendStakeUpside";
import { AnySpendStakeUpsideExactIn } from "@b3dotfun/sdk/anyspend/react/components/AnySpendStakeUpsideExactIn";
import { useGlobalAccount, useIsMobile, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSetActiveWallet } from "thirdweb/react";
import { AvatarEditor } from "./AvatarEditor/AvatarEditor";
import { useB3 } from "./B3Provider/useB3";
import { Deposit } from "./Deposit/Deposit";
import { LinkAccount } from "./LinkAccount/LinkAccount";
import { LinkNewAccount } from "./LinkAccount/LinkNewAccount";
import { ManageAccount } from "./ManageAccount/ManageAccount";
import NotificationsContent from "./ManageAccount/NotificationsContent";
import { RequestPermissions } from "./RequestPermissions/RequestPermissions";
import { Send } from "./Send/Send";
import { SignInWithB3Flow } from "./SignInWithB3/SignInWithB3Flow";
import { ToastContainer, useToastContext } from "./Toast/index";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";
import { AnySpendDepositUpside } from "@b3dotfun/sdk/anyspend/react/components/AnySpendDepositUpside";

const debug = debugB3React("B3DynamicModal");

export function B3DynamicModal() {
  const isOpen = useModalStore(state => state.isOpen);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const contentType = useModalStore(state => state.contentType);
  const navigateBack = useModalStore(state => state.navigateBack);
  const { theme } = useB3();
  const isMobile = useIsMobile();
  const prevIsOpenRef = useRef(isOpen);
  const { wallet } = useGlobalAccount();
  const setActiveWallet = useSetActiveWallet();
  const { toasts, removeToast } = useToastContext();

  // anyspend cleanup global account chnages by setting account back
  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      if (wallet) {
        setActiveWallet(wallet);
      }
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, wallet, setActiveWallet]);

  // Define arrays for different modal type groups
  const fullWidthTypes = [
    "anySpend",
    "anySpendNft",
    "anySpendJoinTournament",
    "anySpendFundTournament",
    "anySpendStakeB3",
    "anySpendStakeB3ExactIn",
    "anySpendStakeUpside",
    "anySpendStakeUpsideExactIn",
    "anySpendBuySpin",
    "anySpendOrderHistory",
    "signInWithB3",
    "anySpendSignatureMint",
    "anySpendBondKit",
    "linkAccount",
    "linkNewAccount",
    "avatarEditor",
    "deposit",
    "send",
    "notifications",
  ];

  const freestyleTypes = [
    "anySpendNft",
    "anySpendJoinTournament",
    "anySpendFundTournament",
    "anySpendStakeB3",
    "anySpendStakeB3ExactIn",
    "anySpendStakeUpside",
    "anySpendStakeUpsideExactIn",
    "anySpendBuySpin",
    "anySpendSignatureMint",
    "anySpendBondKit",
  ];

  // Check if current content type is in freestyle types
  const isFreestyleType = freestyleTypes.includes(contentType?.type as string);
  const hideCloseButton = true;

  // Build content class using cn utility
  // eslint-disable-next-line tailwindcss/no-custom-classname
  const contentClass = cn(
    "b3-modal",
    theme === "dark" && "dark",
    fullWidthTypes.includes(contentType?.type as string) && "w-full",
    isFreestyleType && "b3-modal-freestyle",
    contentType?.type === "signInWithB3" && "p-0",
    contentType?.type === "anySpend" && "md:p-0",
    contentType?.type === "send" && "p-0",
    contentType?.type === "manageAccount" && " md:p-0 md:pt-2",
    contentType?.type === "linkAccount" && "md:p-0",
    // Add specific styles for avatar editor
    // contentType?.type === "avatarEditor_disabled" &&
    //   "h-[90dvh] w-[90vw] bg-black p-0 overflow-y-auto overflow-x-hidden max-md:-mt-8 max-md:rounded-t-xl",
  );

  debug("contentType", contentType);
  const renderContent = () => {
    if (!contentType) return null;

    switch (contentType.type) {
      case "signInWithB3":
        return <SignInWithB3Flow {...contentType} />;
      case "requestPermissions":
        return <RequestPermissions {...contentType} />;
      case "manageAccount":
        return <ManageAccount {...contentType} />;
      case "anySpend":
        return <AnySpend mode="modal" {...contentType} />;
      case "anyspendOrderDetails":
        return <AnySpend mode="modal" loadOrder={contentType.orderId} />;
      case "anySpendNft":
        return <AnySpendNFT {...contentType} mode="modal" />;
      case "anySpendJoinTournament":
        return <AnySpendTournament {...contentType} mode="modal" action="join" />;
      case "anySpendFundTournament":
        return <AnySpendTournament {...contentType} mode="modal" action="fund" />;
      case "anySpendOrderHistory":
        return <OrderHistory {...contentType} mode="modal" />;
      case "anySpendStakeB3":
        return <AnySpendStakeB3 {...contentType} mode="modal" />;
      case "anySpendStakeB3ExactIn":
        return <AnySpendStakeB3ExactIn {...contentType} mode="modal" />;
      case "anySpendStakeUpside":
        return <AnySpendStakeUpside {...contentType} mode="modal" />;
      case "anySpendStakeUpsideExactIn":
        return <AnySpendStakeUpsideExactIn {...contentType} mode="modal" />;
      case "anySpendDepositUpside":
        return <AnySpendDepositUpside {...contentType} mode="modal" />;
      case "anySpendBuySpin":
        return <AnySpendBuySpin {...contentType} mode="modal" />;
      case "anySpendSignatureMint":
        return <AnyspendSignatureMint {...contentType} mode="modal" />;
      case "anySpendBondKit":
        return <AnySpendBondKit {...contentType} />;
      case "linkAccount":
        return <LinkAccount {...contentType} />;
      case "linkNewAccount":
        return <LinkNewAccount {...contentType} />;
      case "anySpendDepositHype":
        return <AnySpendDepositHype {...contentType} mode="modal" />;
      case "anySpendCollectorClubPurchase":
        return <AnySpendCollectorClubPurchase {...contentType} mode="modal" />;
      case "avatarEditor":
        return <AvatarEditor onSetAvatar={contentType.onSuccess} />;
      case "deposit":
        return <Deposit />;
      case "send":
        return <Send {...contentType} />;
      case "notifications":
        return <NotificationsContent {...contentType} />;
      // Add other modal types here
      default:
        return null;
    }
  };

  const ModalComponent = isMobile ? Drawer : Dialog;
  const ModalContent = isMobile ? DrawerContent : DialogContent;
  const ModalTitle = isMobile ? DrawerTitle : DialogTitle;
  const ModalDescription = isMobile ? DrawerDescription : DialogDescription;

  return (
    <ModalComponent open={isOpen} onOpenChange={setB3ModalOpen}>
      <ModalContent
        className={cn(
          contentClass,
          "rounded-2xl bg-white shadow-xl dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-800",
          (contentType?.type === "manageAccount" ||
            contentType?.type === "deposit" ||
            contentType?.type === "send" ||
            contentType?.type === "avatarEditor" ||
            contentType?.type === "notifications") &&
            "p-0",
          "mx-auto w-full max-w-md sm:max-w-lg",
        )}
        hideCloseButton={hideCloseButton}
      >
        <ModalTitle className="sr-only hidden">{contentType?.type || "Modal"}</ModalTitle>
        <ModalDescription className="sr-only hidden">{contentType?.type || "Modal Body"}</ModalDescription>

        <div className={cn("no-scrollbar flex max-h-[90dvh] flex-col overflow-auto sm:max-h-[80dvh]")}>
          {!hideCloseButton && (
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 px-6 py-4 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15.8337 10H4.16699"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.0003 15.8334L4.16699 10L10.0003 4.16669"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-inter text-sm font-semibold">Back</span>
            </button>
          )}
          <div className="flex-1">{renderContent()}</div>

          {/* Toast Container - Part of modal-inner-content layer */}
          <AnimatePresence>
            {toasts.length > 0 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="toast-section relative z-10 overflow-hidden bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="p-4 pt-0"
                >
                  <ToastContainer toasts={toasts} onDismiss={removeToast} theme={theme} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ModalContent>

      {/* Animate inner container margin to cover branding when toasts appear */}
      {isOpen && (
        <style>{`
          .modal-inner-content {
            transition: margin-bottom 0.3s ease-in-out;
            margin-bottom: ${toasts.length > 0 ? "0px" : "23px"} !important;
          }
        `}</style>
      )}

      {contentType?.type === "avatarEditor" && (
        <button
          onClick={() => setB3ModalOpen(false)}
          className="fixed right-5 top-5 z-[100] cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </ModalComponent>
  );
}
