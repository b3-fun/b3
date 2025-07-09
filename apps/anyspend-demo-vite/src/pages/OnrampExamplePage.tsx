import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnrampExamplePage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("10");
  const [recipientAddress, setRecipientAddress] = useState("0x0000000000000000000000000000000000000000");
  const [userId, setUserId] = useState("1234567890");
  const [tokenAddress, setTokenAddress] = useState("0xb3b32f9f8827d4634fe7d973fa1034ec9fddb3b3");
  const [chainId, setChainId] = useState("8453");
  const [partnerId, setPartnerId] = useState("");

  const generateUrl = () => {
    const params = new URLSearchParams({
      amount,
      toCurrency: tokenAddress,
      toChainId: chainId,
      recipient: recipientAddress,
      userId,
      ...(partnerId && { partnerId }),
    });

    return `${window.location.origin}/onramp?${params.toString()}`;
  };

  const handleContinue = () => {
    navigate(
      `/onramp?${new URLSearchParams({
        amount,
        toCurrency: tokenAddress,
        toChainId: chainId,
        recipient: recipientAddress,
        userId,
        ...(partnerId && { partnerId }),
      }).toString()}`,
    );
  };

  return (
    <div className="mx-auto max-w-[460px] pt-8">
      <h1 className="mb-6 text-2xl font-bold">Onramp Example</h1>

      <div className="space-y-4 rounded-lg bg-white p-6 shadow">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Amount (USD)</label>
          <input
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={e => setTokenAddress(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter token address"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Chain ID</label>
          <input
            type="text"
            value={chainId}
            onChange={e => setChainId(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter chain ID"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Recipient Address</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={e => setRecipientAddress(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter recipient address"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter user ID"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Partner ID (optional)</label>
          <input
            type="text"
            value={partnerId}
            onChange={e => setPartnerId(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Enter partner ID"
          />
        </div>

        <div className="rounded-md bg-gray-50 p-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Generated URL</label>
          <div className="break-all rounded border bg-white p-3 font-mono text-sm">{generateUrl()}</div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleContinue}
            className="focus:ring-as-brand text-as-primary w-full rounded-md bg-white px-4 py-2 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Open Payment Flow
          </button>
        </div>
      </div>
    </div>
  );
}
