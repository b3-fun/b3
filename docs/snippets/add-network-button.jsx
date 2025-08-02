export const AddNetworkButton = ({ network = "mainnet", className = "" }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [status, setStatus] = useState("");

  // Network configurations
  const networkConfigs = {
    mainnet: {
      chainId: 8333,
      chainIdHex: "0x2085",
      networkName: "B3 Mainnet",
      rpcUrls: ["https://mainnet-rpc.b3.fun"],
      blockExplorerUrls: ["https://explorer.b3.fun"],
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
    },
    testnet: {
      chainId: 1993,
      chainIdHex: "0x7c9",
      networkName: "B3 Testnet",
      rpcUrls: ["https://testnet-rpc.b3.fun"],
      blockExplorerUrls: ["https://testnet-explorer.b3.fun"],
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
    },
  };

  const config = networkConfigs[network];

  const addNetworkToWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not detected. Please install MetaMask to continue.");
      return;
    }

    setIsAdding(true);
    setStatus("");

    try {
      // First, try to switch to the network if it already exists
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: config.chainIdHex }],
      });

      setStatus(`✅ Successfully switched to ${config.networkName}!`);
    } catch (switchError) {
      // If switching fails, the network probably doesn't exist, so add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: config.chainIdHex,
                chainName: config.networkName,
                rpcUrls: config.rpcUrls,
                blockExplorerUrls: config.blockExplorerUrls,
                nativeCurrency: config.nativeCurrency,
              },
            ],
          });

          setStatus(`✅ Successfully added ${config.networkName} to your wallet!`);
        } catch (addError) {
          console.error("Error adding network:", addError);
          setStatus(`❌ Failed to add network: ${addError.message}`);
        }
      } else {
        console.error("Error switching network:", switchError);
        setStatus(`❌ Failed to switch network: ${switchError.message}`);
      }
    } finally {
      setIsAdding(false);
      // Clear status message after 5 seconds
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const defaultClassName = `
    inline-flex items-center justify-center px-4 py-2 text-sm font-medium
    text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
    focus:ring-offset-2 focus:ring-blue-500 rounded-md transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  return (
    <div className="not-prose">
      <button onClick={addNetworkToWallet} disabled={isAdding} className={className || defaultClassName}>
        {isAdding ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Adding {config.networkName}...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add {config.networkName}
          </>
        )}
      </button>

      {status && (
        <div
          className={`mt-2 text-sm ${
            status.includes("✅") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {status}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <details className="cursor-pointer">
          <summary className="hover:text-gray-700 dark:hover:text-gray-300">Network Details</summary>
          <div className="mt-1 space-y-1 pl-4 font-mono">
            <div>Chain ID: {config.chainId}</div>
            <div>RPC: {config.rpcUrls[0]}</div>
            <div>Explorer: {config.blockExplorerUrls[0]}</div>
            <div>Currency: {config.nativeCurrency.symbol}</div>
          </div>
        </details>
      </div>
    </div>
  );
};

// Quick shortcuts for common use cases
export const AddB3MainnetButton = props => <AddNetworkButton network="mainnet" {...props} />;

export const AddB3TestnetButton = props => <AddNetworkButton network="testnet" {...props} />;
