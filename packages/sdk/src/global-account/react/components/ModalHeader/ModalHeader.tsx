import { ChevronDown, X } from "lucide-react";
import { useModalStore } from "../../stores";

const ModalHeader = ({
  handleBack,
  handleClose,
  title,
}: {
  handleBack?: () => void;
  handleClose?: () => void;
  title: string;
}) => {
  const navigateBack = useModalStore(state => state.navigateBack);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);

  return (
    <div className="flex h-16 items-center justify-between border-b border-[#e4e4e7] bg-white px-5 py-3">
      <button
        onClick={handleBack || navigateBack}
        className="flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-70"
      >
        <ChevronDown className="h-6 w-6 rotate-90 text-[#51525c]" />
      </button>
      <p className="font-inter text-lg font-semibold leading-7 text-[#18181b]">{title}</p>
      <button
        onClick={handleClose || (() => setB3ModalOpen(false))}
        className="flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-70"
      >
        <X className="h-6 w-6 text-[#51525c]" />
      </button>
    </div>
  );
};

export default ModalHeader;
