import {
  AnySpend,
  AnySpendBondKit,
  AnySpendBuySpin,
  AnySpendNFT,
  AnyspendSignatureMint,
  AnySpendStakeB3,
  AnySpendTournament,
  OrderHistory,
} from "@b3dotfun/sdk/anyspend/react";
import { useIsMobile, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useB3 } from "./B3Provider/useB3";
import { ManageAccount } from "./ManageAccount/ManageAccount";
import { RequestPermissions } from "./RequestPermissions/RequestPermissions";
import { SignInWithB3Flow } from "./SignInWithB3/SignInWithB3Flow";
import { TransakModal } from "./Transak/TransakModal";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";

const debug = debugB3React("B3DynamicModal");
export function B3DynamicModal() {
  const { isOpen, setB3ModalOpen, contentType, history, navigateBack } = useModalStore();
  const { theme } = useB3();
  const isMobile = useIsMobile();

  let contentClass = `b3-modal ${theme === "dark" ? "dark" : ""}`;
  let hideCloseButton = false;

  if (
    [
      "anySpend",
      "anySpendNft",
      "anySpendJoinTournament",
      "anySpendFundTournament",
      "anySpendStakeB3",
      "anySpendBuySpin",
      "anySpendOrderHistory",
      "signInWithB3",
      "anySpendSignatureMint",
      "anySpendBondKit",
    ].find(type => contentType?.type === type)
  ) {
    contentClass += " w-full";
  }

  if (
    [
      "anySpendNft",
      "anySpendJoinTournament",
      "anySpendFundTournament",
      "anySpendStakeB3",
      "anySpendBuySpin",
      "anySpendSignatureMint",
      "anySpendBondKit",
    ].find(type => contentType?.type === type)
  ) {
    // Due to the dynamic of (Pay with crypto),(Pay with fiat), we want the height fixed to 90dvh but still scrollable.
    // NOTE: Just leave it here in case we want the fixed height
    // contentClass += " min-h-[90dvh] b3-modal-freestyle";
    contentClass += " b3-modal-freestyle";
    hideCloseButton = true;
  }

  if (contentType?.type === "transak") {
    contentClass += " transak-modal";
  }

  debug("@@DynamicModal:contentType", contentType);
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
      case "transak":
        return <TransakModal />;
      case "anySpendOrderHistory":
        return <OrderHistory onBack={() => {}} mode="modal" />;
      case "anySpendStakeB3":
        return <AnySpendStakeB3 {...contentType} mode="modal" />;
      case "anySpendBuySpin":
        return <AnySpendBuySpin {...contentType} mode="modal" />;
      case "anySpendSignatureMint":
        return <AnyspendSignatureMint {...contentType} mode="modal" />;
      case "anySpendBondKit":
        return <AnySpendBondKit {...contentType} />;
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
      <ModalContent className={contentClass} hideCloseButton={hideCloseButton}>
        <ModalTitle className="sr-only hidden">{contentType?.type || "Modal"}</ModalTitle>
        <ModalDescription className="sr-only hidden">{contentType?.type || "Modal Body"}</ModalDescription>
        <div className="no-scrollbar max-h-[90dvh] overflow-auto sm:max-h-[80dvh]">
          {history.length > 0 && contentType?.showBackButton && (
            <button
              onClick={navigateBack}
              className="b3-modal-back-button mb-4 flex items-center gap-2 transition-colors hover:text-white"
            >
              <span>←</span>
              <span className="text-sm">Back</span>
            </button>
          )}
          {renderContent()}
        </div>
      </ModalContent>
    </ModalComponent>
  );
}
