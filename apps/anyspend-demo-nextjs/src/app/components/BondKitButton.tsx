import { useModalStore } from "@b3dotfun/sdk/global-account/react";

export function BondKitButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  return (
    <button
      onClick={() => {
        setB3ModalOpen(true);
        setB3ModalContentType({
          type: "anySpendBondKit",
          recipientAddress: "0x55c71fca5E01cf246718748Ae540473E608D0282",
          contractAddress: "0x172fc0063E6f96961b7968065F3F1Ee47b1e7ff8",
          // b3Amount: "0.001",
          minTokensOut: "0",
        });
      }}
      className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">BondKit</h3>
        <p className="mt-1 text-sm text-gray-500">Buy BondKit tokens with ETH</p>
      </div>
    </button>
  );
}
