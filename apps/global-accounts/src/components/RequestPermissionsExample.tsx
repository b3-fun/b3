// Add window.ethereum type declaration at the top of the file
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, listener: (...args: any[]) => void) => void;
      removeListener: (event: string, listener: (...args: any[]) => void) => void;
    };
  }
}

import { useB3 } from "@b3dotfun/sdk/global-account/react";
import { motion } from "framer-motion";
import { useState } from "react";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { RequestPermissionsButton } from "@b3dotfun/sdk/global-account/react";
import { defineChain } from "thirdweb";
// Import the wallet generator function
import type { Wallet } from "../utils/wallet";

// Register the language
SyntaxHighlighter.registerLanguage("tsx", tsx);

// Define the B3 chain for the interactive demo
const b3Chain = defineChain({
  id: 8333,
  name: "B3",
  rpc: "https://mainnet-rpc.b3.fun",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
});

// Add interactive test component
function InteractiveDemo({ wallet }: { wallet: Wallet }) {
  const { account: b3Account } = useB3();
  const [approvedTargets, setApprovedTargets] = useState(
    "0xa8e42121e318e3D3BeD7f5969AF6D360045317DD,0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days from now
    return date.toISOString().split("T")[0];
  });
  const [requestResult, setRequestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTargetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApprovedTargets(e.target.value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleSuccess = () => {
    setRequestResult({
      success: true,
      message: "Permissions successfully requested!",
    });
    setTimeout(() => setRequestResult(null), 5000);
  };

  const handleError = async (error: Error) => {
    setRequestResult({
      success: false,
      message: `Error: ${error.message}`,
    });
    setTimeout(() => setRequestResult(null), 5000);
  };

  // Prepare targets array from comma-separated string
  const getTargetsArray = (): `0x${string}`[] => {
    return approvedTargets
      .split(",")
      .map(addr => addr.trim())
      .filter(addr => addr.startsWith("0x")) as `0x${string}`[];
  };

  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-lg border border-gray-200 p-6 text-center">
      <h3 className="mb-8 text-center text-3xl font-bold text-gray-800">Try it out</h3>

      {!b3Account ? (
        <div className="py-6 text-center">
          <p className="text-b3-grey mb-4">You need to sign in with B3 before you can request permissions.</p>
          <div className="flex justify-center">
            <button
              className="bg-b3-blue flex items-center gap-2 rounded-md px-6 py-2 text-white transition-all hover:bg-opacity-90"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <svg
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
        <div className="flex flex-col items-center">
          <RequestPermissionsButton
            chain={b3Chain}
            sessionKeyAddress={wallet.address as `0x${string}`}
            permissions={{
              approvedTargets: getTargetsArray(),
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              nativeTokenLimitPerTransaction: 0,
            }}
            onSuccess={handleSuccess}
            onError={handleError}
          />

          {requestResult && (
            <div
              className={`mt-4 w-full rounded-md p-3 ${requestResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {requestResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const codeExample = `import { B3Provider, RequestPermissionsButton, useB3 } from '@b3dotfun/sdk/global-account';
import { defineChain } from 'thirdweb';

// Define the B3 chain
const b3Chain = defineChain({
  id: 8333,
  name: "B3",
  rpc: "https://mainnet-rpc.b3.fun",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  }
});

function App() {
  return (
    <B3Provider environment="production">
        <RequestPermissionsButton
          chain={b3Chain}
          sessionKeyAddress={account as \`0x\${string}\`}
          permissions={{
            // Specify contract addresses that the session key can interact with
            approvedTargets: [
              "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
              "0xa8e42121e318e3D3BeD7f5969AF6D360045317DD"
            ],
            // Set validity period for the permissions
            startDate: new Date(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
            nativeTokenLimitPerTransaction: 0,
          }}
          onSuccess={() => {
            console.log("Successfully requested permissions!");
          }}
          onError={(error: Error) => {
            console.error("Error requesting permissions:", error);
          }}
        >
          Request Permissions
        </RequestPermissionsButton>
    </B3Provider>
  );
}`;

const anySpendNFTCodeExample = `import { AnySpendNFTButton, useB3, B3Provider } from '@b3dotfun/sdk';

// Define your NFT contract details
const nftContract = {
  contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
  chainId: 8333,
  name: "B3 Example NFT",
  imageUrl: "https://example.com/nft.png",
  description: "A cool NFT from B3",
  price: "10000000000000000", // 0.01 ETH in wei
  priceFormatted: "0.01",
  currency: {
    address: "0x0000000000000000000000000000000000000000",
    chainId: 8333,
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    metadata: {}
  },
  tokenId: null,
};

function App() {

  return (
    <B3Provider environment="production">
      <AnySpendNFTButton
        nftContract={nftContract}
        recipientAddress={account.address} // Ensure account is defined before accessing address
      />
    </B3Provider>
  );
}`;

export function RequestPermissionsExample({ wallet }: { wallet: Wallet }) {
  return (
    <section className="bg-gray-50 py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-4xl"
        >
          <h2 className="font-calibre mb-8 text-center text-4xl font-bold">Request Permissions in Minutes</h2>
          <p className="mb-12 text-center text-xl text-gray-600">
            Allow dApps to interact with contracts on behalf of your users with just a few lines of code
          </p>
          <div className="overflow-hidden rounded-xl [&_.token]:!bg-transparent [&_code]:!bg-transparent [&_pre]:!bg-[#1E1E1E] [&_pre]:!p-8">
            {/* @ts-ignore */}
            <SyntaxHighlighter language="tsx" style={oneDark} wrapLines={true}>
              {codeExample}
            </SyntaxHighlighter>
          </div>

          <InteractiveDemo wallet={wallet} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <h2 className="font-calibre mb-8 text-center text-4xl font-bold">Easy NFT Minting with AnySpend</h2>
          <p className="mb-12 text-center text-xl text-gray-600">
            Use the AnySpend component for a seamless NFT minting experience, handling payments automatically.
          </p>
          <div className="overflow-hidden rounded-xl [&_.token]:!bg-transparent [&_code]:!bg-transparent [&_pre]:!bg-[#1E1E1E] [&_pre]:!p-8">
            {/* @ts-ignore */}
            <SyntaxHighlighter language="tsx" style={oneDark} wrapLines={true}>
              {anySpendNFTCodeExample}
            </SyntaxHighlighter>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
