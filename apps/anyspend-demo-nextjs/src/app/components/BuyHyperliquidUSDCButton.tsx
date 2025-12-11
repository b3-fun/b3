import { HYPERLIQUID_CHAIN_ID, HYPERLIQUID_USDC_ADDRESS } from "@b3dotfun/sdk/anyspend";
import { toast, useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

export function BuyHyperliquidUSDCButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const { address } = useAccountWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(address || "");

  const handleOpenModal = () => {
    setRecipientAddress(address || "");
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!recipientAddress) {
      toast.error("Please enter recipient address");
      return;
    }

    setIsModalOpen(false);
    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "anySpend",
      destinationTokenChainId: HYPERLIQUID_CHAIN_ID,
      destinationTokenAddress: HYPERLIQUID_USDC_ADDRESS,
      recipientAddress,
      onSuccess: () => {
        toast.success("Buy USDC on Hyperliquid success!");
      },
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRecipientAddress(address || "");
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-cyan-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Buy USDC on Hyperliquid</h3>
          <p className="mt-1 text-sm text-gray-500">Swap any token to USDC on Hyperliquid (chain 1337)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-700">Hyperliquid</span>
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">USDC</span>
        </div>
      </button>

      {/* Input Modal for recipient address */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Buy USDC on Hyperliquid</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-md bg-cyan-50 p-3">
                <p className="text-sm text-cyan-800">
                  <strong>Destination:</strong> USDC on Hyperliquid
                </p>
                <p className="mt-1 text-xs text-cyan-600">Chain ID: {HYPERLIQUID_CHAIN_ID}</p>
                <p className="text-xs text-cyan-600">Address: {HYPERLIQUID_USDC_ADDRESS}</p>
              </div>

              <div>
                <label htmlFor="recipient-address" className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient Address (Hyperliquid wallet)
                </label>
                <input
                  id="recipient-address"
                  type="text"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-2 space-x-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 rounded-md bg-cyan-600 px-4 py-2 text-white transition-colors hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
