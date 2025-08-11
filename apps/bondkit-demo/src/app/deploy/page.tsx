"use client";

import { cn } from "@/utils/cn";
import { BaseBondkitTokenFactoryContractAddress, BondkitTokenConfig, BondkitTokenFactoryABI } from "@b3dotfun/sdk/bondkit";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Abi, decodeEventLog, formatEther, parseEther } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

interface ConfigFieldInfo {
  title: string;
  description: string;
  example?: string;
}

const configGuide: Record<keyof BondkitTokenConfig, ConfigFieldInfo> = {
  name: { title: "Token Name", description: "Choose a unique name for your token." },
  symbol: { title: "Token Symbol", description: "Choose a short symbol (2-6 characters)." },
  feeRecipient: { title: "Fee Recipient", description: "Address receiving trading fees." },
  finalTokenSupply: { title: "Final Token Supply", description: "Total number of tokens that will exist." },
  targetEth: { title: "Target ETH", description: "Amount of ETH needed to complete bonding." },
  lpSplitRatioFeeRecipientBps: { title: "LP Split Ratio", description: "Percentage (in BPS) of LP tokens for fee recipient." },
  aggressivenessFactor: { title: "Aggressiveness Factor", description: "Controls bonding curve steepness (1-100)." },
  migrationAdminAddress: { title: "Migration Admin", description: "Can migrate to DEX when ready." },
  uniswapV2RouterAddress: { title: "Uniswap V2 Router", description: "DEX router for migration." },
};

function AggressivenessVisualizer({ value }: { value: number }) {
  const getColor = (val: number) => {
    if (val < 25) return "bg-emerald-500";
    if (val < 75) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getDescription = (val: number) => {
    if (val < 25) return "More Stable, Lower Returns";
    if (val < 75) return "Balanced";
    return "More Volatile, Higher Potential";
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-200", getColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-sm text-gray-400 font-medium">
        {getDescription(value)}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Conservative</span>
        <span>Balanced</span>
        <span>Aggressive</span>
      </div>
    </div>
  );
}

function SuccessModal({ tokenAddress, onClose }: { tokenAddress: string, onClose: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6 space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-100 mb-2">Token Deployed Successfully!</h3>
          <p className="text-gray-400">Your token has been deployed to the Base network.</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 space-y-1">
          <p className="text-sm text-gray-400">Contract Address:</p>
          <p className="font-mono text-sm text-blue-400 break-all">{tokenAddress}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/token/${tokenAddress}`)}
            className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            View Token Page
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold py-2.5 px-4 rounded-xl transition-colors"
          >
            Back to All Tokens
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-300 py-2.5 px-4 rounded-xl transition-colors border border-gray-700 hover:border-gray-600"
          >
            Deploy Another Token
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeployPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { data: hash, isPending, writeContract } = useWriteContract();
  const [activeTokenAddress, setActiveTokenAddress] = useState<`0x${string}` | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Keep track of raw input values for decimal fields
  const [rawInputs, setRawInputs] = useState({
    targetEth: "0.0000001",
    finalTokenSupply: "100000000000"
  });

  const [config, setConfig] = useState<BondkitTokenConfig>({
    name: "My Demo Token",
    symbol: "MDT",
    feeRecipient: (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    finalTokenSupply: parseEther("100000000000"),
    aggressivenessFactor: 50,
    lpSplitRatioFeeRecipientBps: BigInt(1000),
    targetEth: parseEther("0.0000001"),
    uniswapV2RouterAddress: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24" as `0x${string}`,
    migrationAdminAddress: (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  });

  // Update config when address changes
  useEffect(() => {
    if (address) {
      setConfig(prev => ({
        ...prev,
        feeRecipient: address as `0x${string}`,
        migrationAdminAddress: address as `0x${string}`
      }));
    }
  }, [address]);

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    writeContract({
      address: BaseBondkitTokenFactoryContractAddress,
      abi: BondkitTokenFactoryABI,
      functionName: "deployBondkitToken",
      args: [config],
    });
  };

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (receipt) {
      for (const log of receipt.logs) {
        try {
          const event = decodeEventLog({
            abi: BondkitTokenFactoryABI as Abi,
            data: log.data,
            topics: log.topics,
          });
          if (event.eventName === "BondkitTokenCreated") {
            const { tokenAddress } = event.args as unknown as {
              tokenAddress: `0x${string}`;
            };
            setActiveTokenAddress(tokenAddress);
            setShowSuccessModal(true);
          }
        } catch {
          /* ignore */
        }
      }
    }
  }, [receipt]);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setActiveTokenAddress(null);
  };

  const handleInputChange = (field: keyof BondkitTokenConfig, value: string) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      
      switch(field) {
        case 'name':
        case 'symbol':
          newConfig[field] = value;
          break;
        case 'feeRecipient':
        case 'migrationAdminAddress':
          // Ensure addresses are valid hex
          if (value.startsWith('0x') && value.length === 42) {
            newConfig[field] = value as `0x${string}`;
          }
          break;
        case 'targetEth':
          // Handle decimal input for ETH
          setRawInputs(prev => ({ ...prev, targetEth: value }));
          if (value && !isNaN(Number(value))) {
            try {
              newConfig.targetEth = parseEther(value);
            } catch {}
          }
          break;
        case 'finalTokenSupply':
          // Handle decimal input for token supply
          setRawInputs(prev => ({ ...prev, finalTokenSupply: value }));
          if (value && !isNaN(Number(value))) {
            try {
              newConfig.finalTokenSupply = parseEther(value);
            } catch {}
          }
          break;
        case 'lpSplitRatioFeeRecipientBps':
          // Validate BPS (0-10000)
          const bps = parseInt(value);
          if (!isNaN(bps) && bps >= 0 && bps <= 10000) {
            newConfig[field] = BigInt(bps);
          }
          break;
        case 'aggressivenessFactor':
          const factor = parseInt(value);
          if (!isNaN(factor) && factor >= 1 && factor <= 100) {
            newConfig[field] = factor;
          }
          break;
      }
      
      return newConfig;
    });
  };

  // Helper function to format ETH values for display
  const formatEthInput = (wei: bigint): string => {
    try {
      const ethValue = formatEther(wei);
      // Remove trailing zeros after decimal point
      return ethValue.replace(/\.?0+$/, '');
    } catch {
      return '0';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-300 hover:text-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Tokens</span>
              </button>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="flex-1 space-y-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">Deploy New Token</h1>

            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-gray-800/50 backdrop-blur border border-gray-700">
                <p className="text-lg text-gray-300">Please connect your wallet to deploy a token</p>
              </div>
            ) : (
              <>
                {/* Loading Overlay */}
                {(isPending || isConfirming) && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-100">
                            {isPending ? "Deploying Token..." : "Confirming Transaction..."}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {isPending 
                              ? "Please confirm the transaction in your wallet"
                              : "Please wait while the transaction is being confirmed"}
                          </p>
                        </div>
                        {hash && (
                          <a
                            href={`https://basescan.org/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View on BaseScan →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && activeTokenAddress && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full mx-4 p-6 space-y-6">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-100 mb-2">Token Deployed Successfully!</h3>
                        <p className="text-gray-400">Your token has been deployed to the Base network.</p>
                      </div>

                      <div className="bg-gray-800/50 rounded-xl p-4 space-y-1">
                        <p className="text-sm text-gray-400">Contract Address:</p>
                        <p className="font-mono text-sm text-blue-400 break-all">{activeTokenAddress}</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => router.push(`/token/${activeTokenAddress}`)}
                          className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                        >
                          View Token Page
                        </button>
                        <button
                          onClick={() => router.push('/')}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold py-2.5 px-4 rounded-xl transition-colors"
                        >
                          Back to All Tokens
                        </button>
                        <button
                          onClick={handleCloseSuccessModal}
                          className="w-full text-gray-400 hover:text-gray-300 py-2.5 px-4 rounded-xl transition-colors border border-gray-700 hover:border-gray-600"
                        >
                          Deploy Another Token
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleDeploy} className="space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-6 p-6 rounded-2xl bg-gray-800/50 backdrop-blur border border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-100">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Token Name</label>
                        <input
                          type="text"
                          value={config.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 focus:border-blue-500 rounded-xl text-gray-100 placeholder-gray-500 transition-colors duration-200"
                          placeholder="My Demo Token"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Token Symbol</label>
                        <input
                          type="text"
                          value={config.symbol}
                          onChange={(e) => handleInputChange('symbol', e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 focus:border-blue-500 rounded-xl text-gray-100 placeholder-gray-500 transition-colors duration-200"
                          placeholder="MDT"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Token Economics */}
                  <div className="space-y-6 p-6 rounded-2xl bg-gray-800/50 backdrop-blur border border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-100">Token Economics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Target ETH</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={rawInputs.targetEth}
                            onChange={(e) => handleInputChange('targetEth', e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 focus:border-blue-500 rounded-xl text-gray-100 placeholder-gray-500 transition-colors duration-200"
                            placeholder="0.0000001"
                            required
                          />
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <span className="text-gray-500">ETH</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Final Token Supply</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={rawInputs.finalTokenSupply}
                            onChange={(e) => handleInputChange('finalTokenSupply', e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 focus:border-blue-500 rounded-xl text-gray-100 placeholder-gray-500 transition-colors duration-200"
                            placeholder="100000000000"
                            required
                          />
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <span className="text-gray-500">Tokens</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">LP Split Ratio</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="10000"
                            value={Number(config.lpSplitRatioFeeRecipientBps)}
                            onChange={(e) => handleInputChange('lpSplitRatioFeeRecipientBps', e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 focus:border-blue-500 rounded-xl text-gray-100 placeholder-gray-500 transition-colors duration-200"
                            placeholder="1000"
                            required
                          />
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <span className="text-gray-500">BPS</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Aggressiveness Factor</label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={config.aggressivenessFactor}
                          onChange={(e) => handleInputChange('aggressivenessFactor', e.target.value)}
                          className="w-full accent-blue-500"
                          required
                        />
                        <AggressivenessVisualizer value={config.aggressivenessFactor} />
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-6 p-6 rounded-2xl bg-gray-800/50 backdrop-blur border border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-100">Contract Addresses</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Fee Recipient</label>
                        <input
                          type="text"
                          value={config.feeRecipient}
                          onChange={(e) => handleInputChange('feeRecipient', e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 focus:border-blue-500 rounded-xl text-gray-100 font-mono text-sm placeholder-gray-500 transition-colors duration-200"
                          placeholder="0x..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Migration Admin</label>
                        <input
                          type="text"
                          value={config.migrationAdminAddress}
                          onChange={(e) => handleInputChange('migrationAdminAddress', e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 focus:border-blue-500 rounded-xl text-gray-100 font-mono text-sm placeholder-gray-500 transition-colors duration-200"
                          placeholder="0x..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Uniswap V2 Router</label>
                        <input
                          type="text"
                          value={config.uniswapV2RouterAddress}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-xl text-gray-100 font-mono text-sm placeholder-gray-500 opacity-75 cursor-not-allowed"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">This address is fixed for the Base network</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl font-semibold text-lg transition-all duration-200",
                      isPending
                        ? "bg-blue-500/50 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 transform hover:scale-[1.02]"
                    )}
                  >
                    {isPending ? "Deploying..." : "Deploy Token"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Configuration Guide Panel */}
          <div className="lg:w-96 h-fit sticky top-8">
            <div className="p-6 rounded-2xl bg-gray-800/50 backdrop-blur border border-gray-700">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 mb-6">Configuration Guide</h2>
              
              <div className="space-y-6">
                {Object.entries(configGuide).map(([key, info]) => (
                  <div key={key} className="pb-4 border-b border-gray-700/50 last:border-0">
                    <h3 className="text-gray-100 font-medium mb-2">{info.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{info.description}</p>
                    {info.example && (
                      <p className="mt-1 text-xs text-gray-500">{info.example}</p>
                    )}
                    {key === 'aggressivenessFactor' && (
                      <AggressivenessVisualizer value={config.aggressivenessFactor} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 