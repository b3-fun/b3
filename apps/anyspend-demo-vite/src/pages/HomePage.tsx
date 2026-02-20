import { B3_TOKEN, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useNavigate } from "react-router-dom";
import { parseUnits } from "viem";
import { base } from "viem/chains";

export default function HomePage() {
  const navigate = useNavigate();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  const handleMint = async () => {
    // Generate random token ID between 0 and 6
    const randomTokenId = Math.floor(Math.random() * 7);

    setB3ModalOpen(true);
    setB3ModalContentType({
      type: "anySpendNft",
      nftContract: {
        chainId: base.id,
        contractAddress: "0xe04074c294d0Db90F0ffBC60fa61b48672C91965",
        price: "1990000", // 1.99 USDC (6 decimals)
        priceFormatted: "1.99",
        currency: USDC_BASE,
        imageUrl: "https://cdn.b3.fun/b3kemon-card.png",
        name: "Mystery B3kemon",
        description: "Summon a mysterious B3kemon creature!",
        tokenId: randomTokenId,
        type: "erc1155",
      },
      recipientAddress: "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-center text-3xl font-bold text-gray-800">AnySpend Examples</h1>
          <p className="mb-12 text-center text-gray-500">Experience seamless crypto transactions</p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <button
              onClick={() => {
                setB3ModalOpen(true);
                setB3ModalContentType({ type: "anySpend" });
              }}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Swap Tokens</h3>
                <p className="mt-1 text-sm text-gray-500">Swap between any supported tokens instantly</p>
              </div>
            </button>

            <button
              onClick={() => {
                setB3ModalOpen(true);
                setB3ModalContentType({ type: "anySpend", defaultActiveTab: "fiat" });
              }}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-purple-100 hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Buy with Fiat</h3>
                <p className="mt-1 text-sm text-gray-500">Purchase crypto directly with your credit card</p>
              </div>
            </button>

            <button
              onClick={handleMint}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-green-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Mint B3kemon</h3>
                <p className="mt-1 text-sm text-gray-500">Mint your own mysterious B3kemon NFT</p>
              </div>
            </button>

            <button
              onClick={() => {
                setB3ModalOpen(true);
                setB3ModalContentType({
                  type: "anySpend",
                  destinationTokenAddress: B3_TOKEN.address,
                  destinationTokenChainId: B3_TOKEN.chainId,
                });
              }}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Get B3 Token</h3>
                <p className="mt-1 text-sm text-gray-500">Purchase B3 tokens directly through AnySpend</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/gas-funding")}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-orange-100 hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Gas Funding</h3>
                <p className="mt-1 text-sm text-gray-500">Fund wallets with gas on any chain via AnySpend workflow</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/checkout")}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-emerald-100 hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Checkout Page</h3>
                <p className="mt-1 text-sm text-gray-500">Two-column Shopify-style checkout with multi-item cart</p>
              </div>
            </button>

            <button
              onClick={() => {
                setB3ModalOpen(true);
                setB3ModalContentType({
                  type: "anySpendCheckoutTrigger",
                  recipientAddress: "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4",
                  destinationTokenAddress: B3_TOKEN.address,
                  destinationTokenChainId: B3_TOKEN.chainId,
                  totalAmount: parseUnits("200", 18).toString(),
                  organizationName: "B3kemon Shop",
                  organizationLogo: "https://cdn.b3.fun/b3kemon-card.png",
                  buttonText: "Pay Now",
                  workflowId: "demo-workflow-1",
                  orgId: "demo-org-1",
                  onSuccess: result => console.log("Checkout modal success:", result),
                  onError: error => console.error("Checkout modal error:", error),
                });
              }}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-teal-100 hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Checkout Modal (No Items)</h3>
                <p className="mt-1 text-sm text-gray-500">Just total + payment panel, no line items</p>
              </div>
            </button>

            <button
              onClick={() => {
                setB3ModalOpen(true);
                setB3ModalContentType({
                  type: "anySpendCheckoutTrigger",
                  recipientAddress: "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4",
                  destinationTokenAddress: B3_TOKEN.address,
                  destinationTokenChainId: B3_TOKEN.chainId,
                  items: [
                    {
                      id: "item-1",
                      name: "B3kemon Starter Pack",
                      description: "3 random B3kemon creatures",
                      imageUrl: "https://cdn.b3.fun/b3kemon-card.png",
                      amount: parseUnits("100", 18).toString(),
                      quantity: 1,
                    },
                    {
                      id: "item-2",
                      name: "Rare Pokeball",
                      description: "Increases catch rate by 2x",
                      amount: parseUnits("50", 18).toString(),
                      quantity: 2,
                    },
                  ],
                  organizationName: "B3kemon Shop",
                  organizationLogo: "https://cdn.b3.fun/b3kemon-card.png",
                  buttonText: "Pay Now",
                  workflowId: "demo-workflow-1",
                  orgId: "demo-org-1",
                  callbackMetadata: { inputs: { source: "demo-vite" } },
                  onSuccess: result => console.log("Checkout modal success:", result),
                  onError: error => console.error("Checkout modal error:", error),
                });
              }}
              className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-teal-100 hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">Checkout Modal</h3>
                <p className="mt-1 text-sm text-gray-500">Shopify-style checkout in a modal with predefined items</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
