import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";

export function CollectorClubPurchaseButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const currentWallet = useAccountWallet();

  const hasAddress = !!currentWallet.address;

  return (
    <button
      onClick={() => {
        if (!currentWallet.address) return;

        setB3ModalOpen(true);
        setB3ModalContentType({
          type: "anySpendCollectorClubPurchase",
          packId: 3,
          packAmount: 2,
          pricePerPack: "1000000", // 1 USDC in wei (6 decimals)
          recipientAddress: currentWallet.address,
          paymentType: "crypto",
          vendingMachineId: "1",
          packType: "1",
        });
      }}
      disabled={!hasAddress}
      className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-100 disabled:hover:shadow-sm"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Collector Club Packs</h3>
        <p className="mt-1 text-sm text-gray-500">Buy 1 pack at 1 USDC each using any token</p>
      </div>
    </button>
  );
}
