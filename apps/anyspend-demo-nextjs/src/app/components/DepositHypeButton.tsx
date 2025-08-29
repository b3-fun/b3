import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

export function DepositHypeButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const { address } = useAccountWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(address || "");
  const [paymentType, setPaymentType] = useState<"crypto" | "fiat">("crypto");

  const handleOpenModal = (selectedPaymentType: "crypto" | "fiat") => {
    setPaymentType(selectedPaymentType);
    setRecipientAddress(address || ""); // Reset to current address when modal opens
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!recipientAddress) {
      alert("Please enter recipient address");
      return;
    }

    try {
      setIsModalOpen(false); // Close input modal first
      setB3ModalOpen(true);
      setB3ModalContentType({
        type: "anySpendDepositHype",
        recipientAddress: recipientAddress,
        paymentType: paymentType,
        sourceTokenAddress: "0x0000000000000000000000000000000000000000",
        sourceTokenChainId: 8453,
      });
    } catch (error) {
      alert("Please enter a valid deposit amount");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRecipientAddress(address || "");
  };

  return (
    <>
      <div className="space-y-4">
        <button
          onClick={() => handleOpenModal("crypto")}
          className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Deposit HYPE (Crypto)</h3>
            <p className="mt-1 text-sm text-gray-500">Pay with crypto to deposit HYPE for</p>
          </div>
        </button>

        <button
          onClick={() => handleOpenModal("fiat")}
          className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-green-100 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Deposit HYPE (Fiat)</h3>
            <p className="mt-1 text-sm text-gray-500">Pay with USD/card to deposit HYPE </p>
          </div>
        </button>
      </div>

      {/* Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Deposit HYPE ({paymentType === "crypto" ? "Crypto" : "Fiat"})
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="modal-deposit-amount" className="mb-1 block text-sm font-medium text-gray-700">
                  Payment Type
                </label>
                <select
                  id="payment-type"
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value as "crypto" | "fiat")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="crypto">Crypto</option>
                  <option value="fiat">Fiat</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-recipient-address" className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient Address
                </label>
                <input
                  id="modal-recipient-address"
                  type="text"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 space-x-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
