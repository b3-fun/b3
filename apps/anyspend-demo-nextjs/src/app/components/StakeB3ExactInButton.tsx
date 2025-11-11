import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";

export function StakeB3ExactInButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const currentWallet = useAccountWallet();

  return (
    <button
      onClick={() => {
        setB3ModalOpen(true);
        setB3ModalContentType({
          type: "anySpendStakeB3ExactIn",
          recipientAddress: currentWallet.address || "",
        });
      }}
      className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Stake B3 (Exact In)</h3>
        <p className="mt-1 text-sm text-gray-500">Route through CustomExactIn to auto-stake your swapped B3</p>
      </div>
    </button>
  );
}
