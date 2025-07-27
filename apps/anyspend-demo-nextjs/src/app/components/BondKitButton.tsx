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
          recipientAddress: "0xd67C2dfb4862Ae6F5c079FbEbF403dC01E5Df3f0",
          contractAddress: "0x01ef4b21bb06fa40fe08e112a472b8925bb271d1",
          ethAmount: "0.001",
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
