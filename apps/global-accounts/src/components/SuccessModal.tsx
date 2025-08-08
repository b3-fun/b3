import * as Dialog from "@radix-ui/react-dialog";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  explorerTxUrl?: string;
  title: string;
}

export function SuccessModal({ isOpen, onClose, explorerTxUrl, title }: SuccessModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[5px]">
          <Dialog.Content className="font-neue-montreal w-[90%] max-w-[540px] rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-lg">
            <div className="text-b3-blue my-8 flex items-center justify-center gap-3 text-3xl font-bold">
              <span>🎉</span>
              {title}
              <span>🎉</span>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {explorerTxUrl && (
                <a
                  href={explorerTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-b3-blue hover:bg-b3-blue/90 mt-4 w-full rounded-lg px-6 py-2 text-lg font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  View Transaction ↗
                </a>
              )}

              <button
                onClick={onClose}
                className="w-full rounded-lg border border-gray-200 bg-white px-6 py-2 text-lg font-bold text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
