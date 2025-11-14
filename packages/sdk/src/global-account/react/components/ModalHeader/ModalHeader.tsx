import { cn } from "@b3dotfun/sdk/shared/utils";
import { ChevronLeft, X } from "lucide-react";
import { useModalStore } from "../../stores";

const ModalHeader = ({
  showBackButton = true,
  handleBack,
  handleClose,
  title,
  children,
  showCloseButton = true,
  className,
  showBackWord = false,
}: {
  showBackButton?: boolean;
  handleBack?: () => void;
  handleClose?: () => void;
  title: string;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
  showBackWord?: boolean;
}) => {
  const navigateBack = useModalStore(state => state.navigateBack);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);

  return (
    <div
      className={cn(
        "b3-modal-header flex h-16 items-center justify-between border-b border-[#e4e4e7] bg-white px-5 py-3",
        className,
      )}
    >
      {showBackButton ? (
        <button
          onClick={handleBack || navigateBack}
          className="flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="h-6 w-6 text-[#51525c]" />
          {showBackWord && <span className="text-sm font-medium">Back</span>}
        </button>
      ) : (
        <div className="w-2" />
      )}
      <p className="font-inter text-lg font-semibold leading-7 text-[#18181b]">{title}</p>
      {showCloseButton ? (
        <button
          onClick={handleClose || (() => setB3ModalOpen(false))}
          className="flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-70"
        >
          <X className="h-6 w-6 text-[#51525c]" />
        </button>
      ) : (
        <div className="w-2" />
      )}
      {children}
    </div>
  );
};

export default ModalHeader;
