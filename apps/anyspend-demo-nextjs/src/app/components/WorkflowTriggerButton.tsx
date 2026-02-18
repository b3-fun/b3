import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

export function WorkflowTriggerButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const { address } = useAccountWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(address || "");
  const [chainId, setChainId] = useState("8453");
  const [tokenAddress, setTokenAddress] = useState("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  const [amount, setAmount] = useState("1000000");
  const [workflowId, setWorkflowId] = useState("");
  const [orgId, setOrgId] = useState("");

  const handleSubmit = () => {
    if (!recipientAddress || !workflowId || !orgId) {
      alert("Please fill in all required fields");
      return;
    }

    setIsModalOpen(false);
    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "anySpendWorkflowTrigger",
      recipientAddress,
      chainId: Number(chainId),
      tokenAddress,
      amount,
      workflowId,
      orgId,
      actionLabel: "Pay to trigger workflow",
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setRecipientAddress(address || "");
          setIsModalOpen(true);
        }}
        className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Workflow Trigger Payment</h3>
          <p className="mt-1 text-sm text-gray-500">Pay to trigger a B3OS workflow via AnySpend</p>
        </div>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Workflow Trigger Payment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Recipient Address *</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Chain ID</label>
                  <input
                    type="number"
                    value={chainId}
                    onChange={e => setChainId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Amount (wei)</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="1000000"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Token Address</label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={e => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Workflow ID *</label>
                <input
                  type="text"
                  value={workflowId}
                  onChange={e => setWorkflowId(e.target.value)}
                  placeholder="wf_..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Org ID *</label>
                <input
                  type="text"
                  value={orgId}
                  onChange={e => setOrgId(e.target.value)}
                  placeholder="org_..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                >
                  Open Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
