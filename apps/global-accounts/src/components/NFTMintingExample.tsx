import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";
import { useB3Account } from "@b3dotfun/sdk/global-account/react/components/B3Provider/useB3Account";

// Define an example NFT contract (type inference should work)
const exampleNFT = {
  chainId: 8453,
  contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
  price: "500000000000000000",
  priceFormatted: "0.5",
  currency: {
    chainId: 8453,
    address: "0xb3b32f9f8827d4634fe7d973fa1034ec9fddb3b3",
    decimals: 18,
    name: "B3",
    symbol: "B3",
    metadata: {
      logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/35690.png",
    },
  },
  imageUrl:
    "https://storage.googleapis.com/nftimagebucket/base/tokens/0x80f0e6644723abb03aa8867d21e32bd854b2a2d9/preview/TVRjME1EUTRORFl4T0E9PV8zNjcy.jpg",
  name: "Downhill Ski",
  description: "Downhill Ski",
  tokenId: null,
};

export function NFTMintingExample() {
  const account = useB3Account();

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-md rounded-xl border border-gray-200 p-8 text-center">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">Try it out</h2>
          {!account ? (
            <div className="py-6 text-center">
              <p className="mb-4 text-gray-600">Please sign in with B3 first to enable minting.</p>
              <div className="flex justify-center">
                <button
                  className="flex items-center gap-2 rounded-md bg-blue-500 px-6 py-2 text-white transition-all hover:bg-blue-600"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <svg /* Sign-in icon SVG */
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  Sign in with B3
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <AnySpendNFTButton nftContract={exampleNFT} recipientAddress={account?.address} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
