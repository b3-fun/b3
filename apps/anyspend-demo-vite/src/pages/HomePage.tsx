import { B3_TOKEN, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";
import { base } from "viem/chains";

export default function HomePage() {
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
          </div>
        </div>
      </div>
    </div>
  );
}
