import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";
import {
  B3DynamicModal,
  B3Provider,
  RequestPermissionsButton,
  SignInWithB3,
  useB3,
} from "@b3dotfun/sdk/global-account/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Account } from "thirdweb/wallets";
import { NFT_CONTRACTS } from "./constants";
import { queryClient } from "./utils/queryClient";

// export const wagmiConfig = createConfig({
//   chains: [supportedChains[0], ...supportedChains.slice(1)],
//   transports: Object.fromEntries(supportedChains.map(chain => [chain.id, http()])) as any
// });

// Define chain configuration outside component
const b3Chain = {
  id: 8333,
  name: "B3",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpc: "https://mainnet-rpc.b3.fun",
  icon: {
    url: "https://cdn.b3.fun/b3-logo-white-circle.svg",
    width: 32,
    height: 32,
    format: "svg",
  },
  blockExplorers: [
    {
      name: "B3 Explorer",
      url: "https://explorer.b3.fun/",
    },
  ],
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const connectToWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);

          // Listen for account changes
          const handleAccountsChanged = (accounts: string[]) => {
            setAccount(accounts[0]);
          };

          window.ethereum.on("accountsChanged", handleAccountsChanged);

          return () => {
            // Clean up listeners when component unmounts
            if (window.ethereum) {
              window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            }
          };
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        console.error("No Ethereum wallet detected in browser");
      }
    };

    connectToWallet();
  }, []);

  if (!account) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <B3Provider environment="production" theme="light" partnerId="b9aac999-efef-4625-96d6-8043f20ec615">
        <B3DynamicModal />
        <InnerComponent account={account} />
      </B3Provider>
    </QueryClientProvider>
  );
}

const InnerComponent = ({ account }: { account: string }) => {
  const { account: b3Account } = useB3();

  console.log("b3Account", b3Account);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-xl p-6 text-center">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">B3 Authentication Example</h1>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <SignInWithB3
              chain={b3Chain}
              sessionKeyAddress={account as `0x${string}`}
              onLoginSuccess={(globalAccount: Account) => {
                console.log("User authenticated with Global Account!", globalAccount);
              }}
            />

            {!!b3Account && (
              <>
                <RequestPermissionsButton
                  chain={b3Chain}
                  sessionKeyAddress={account as `0x${string}`}
                  onSuccess={() => {
                    console.log("Successfully requested permissions!");
                  }}
                  onError={async (error: Error) => {
                    console.error("Error requesting permissions:", error);
                  }}
                  permissions={{
                    approvedTargets: [
                      "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
                      "0xa8e42121e318e3D3BeD7f5969AF6D360045317DD",
                      "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
                      "0x8a19BA9A95F17D193bD751B80eF8B89b88E2856C",
                    ],
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                    nativeTokenLimitPerTransaction: 0.0001,
                  }}
                />

                <div className="mt-12">
                  <h2 className="mb-8 text-3xl font-bold text-gray-900">Available NFTs</h2>
                  <div className="grid grid-cols-1 gap-8">
                    {NFT_CONTRACTS.map((nft, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                      >
                        <div className="flex items-center gap-6">
                          <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl">
                            <img src={nft.imageUrl} alt={nft.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-col items-start text-left">
                            <h3 className="text-xl font-semibold text-gray-900">{nft.name}</h3>
                            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{nft.description}</p>
                            <div className="mt-4 flex items-center gap-4">
                              <span className="text-lg font-bold text-gray-900">
                                {nft.priceFormatted} {nft.currency.symbol}
                              </span>
                              <AnySpendNFTButton nftContract={nft} recipientAddress={b3Account?.address} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
