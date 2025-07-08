"use client";

import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";

export default function Home() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const { address } = useAccountWallet();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-center text-3xl font-bold text-gray-800">AnySpend Demo</h1>
          <p className="mb-12 text-center text-gray-500">Experience seamless crypto transactions</p>
          
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-gray-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Swap Tokens</h3>
                  <p className="mt-1 text-sm text-gray-500">Swap between any supported tokens instantly</p>
                </div>
                <button
                  onClick={() => {
                    setB3ModalOpen(true);
                    setB3ModalContentType({ type: "anySpend" });
                  }}
                  className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  Swap Now →
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-gray-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Buy with Fiat</h3>
                  <p className="mt-1 text-sm text-gray-500">Purchase crypto directly with your credit card</p>
                </div>
                <button
                  onClick={() => {
                    setB3ModalOpen(true);
                    setB3ModalContentType({ type: "anySpend", defaultActiveTab: "fiat" });
                  }}
                  className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-100"
                >
                  Buy Now →
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-gray-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Get B3 Token</h3>
                  <p className="mt-1 text-sm text-gray-500">Purchase B3 tokens directly through AnySpend</p>
                </div>
                <button
                  onClick={() => {
                    setB3ModalOpen(true);
                    setB3ModalContentType({
                      type: "anySpend",
                      destinationTokenAddress: B3_TOKEN.address,
                      destinationTokenChainId: B3_TOKEN.chainId
                    });
                  }}
                  className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                  Get B3 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
