"use client";

import { cn } from "@/utils/cn";
import { BondkitTokenFactory, type BondkitTokenConfig } from "@b3dotfun/sdk/bondkit";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatEther, parseEther } from "viem";
import { base } from "viem/chains";
import SignInWithB3OnBase from "../SignInWithB3OnBase";

interface ConfigFieldInfo {
  title: string;
  description: string;
  example?: string;
}

// const configGuide: Record<keyof BondkitTokenConfig, ConfigFieldInfo> = {
//   name: { title: "Token Name", description: "Choose a unique name for your token." },
//   symbol: { title: "Token Symbol", description: "Choose a short symbol (2-6 characters)." },
//   feeRecipient: { title: "Fee Recipient", description: "Address receiving trading fees." },
//   finalTokenSupply: { title: "Final Token Supply", description: "Total number of tokens that will exist." },
//   targetEth: { title: "Target ETH", description: "Amount of ETH needed to complete bonding." },
//   lpSplitRatioFeeRecipientBps: {
//     title: "LP Split Ratio",
//     description: "Percentage (in BPS) of LP tokens for fee recipient.",
//   },
//   uniswapV2RouterAddress: { title: "Uniswap V2 Router", description: "Router address for DEX operations." },
//   aggressivenessFactor: { title: "Aggressiveness Factor", description: "Controls price curve steepness (1-100)." },
//   migrationAdminAddress: { title: "Migration Admin", description: "Address that can migrate to DEX." },
//   externalTokenAddress: { title: "External Token", description: "Optional external token address." },
//   baseTokenMetadata: { title: "Base Token Metadata", description: "Optional metadata URL." },
//   externalTokenMetadata: { title: "External Token Metadata", description: "Optional metadata URL." },
//   externalTokenBuyQuote: { title: "Buy Quote", description: "External token buy quote." },
//   externalTokenSellQuote: { title: "Sell Quote", description: "External token sell quote." },
//   lpTokenMetadata: { title: "LP Token Metadata", description: "Optional LP metadata URL." },
//   uniswapV3FeeTier: { title: "Uniswap V3 Fee Tier", description: "Fee tier for V3 pool." },
// };

const presetTemplates = [
  {
    name: "Standard Token",
    description: "Basic bonding curve token",
    config: {
      finalTokenSupply: parseEther("100000000000"),
      targetEth: parseEther("0.0000001"),
      aggressivenessFactor: 50,
      lpSplitRatioFeeRecipientBps: BigInt(1000),
    },
  },
  {
    name: "Quick Launch",
    description: "Fast bonding with lower target",
    config: {
      finalTokenSupply: parseEther("100000000000"),
      targetEth: parseEther("0.000001"),
      aggressivenessFactor: 70,
      lpSplitRatioFeeRecipientBps: BigInt(500),
    },
  },
  {
    name: "Community Token",
    description: "Higher supply, gradual curve",
    config: {
      finalTokenSupply: parseEther("100000000000"),
      targetEth: parseEther("0.01"),
      aggressivenessFactor: 30,
      lpSplitRatioFeeRecipientBps: BigInt(2000),
    },
  },
];

export default function DeployPage() {
  const { address } = useAccountWallet();
  const isConnected = !!address;
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const isConfirming = false;
  const factoryRef = useRef<BondkitTokenFactory | null>(null);

  // Initialize SDK factory and connect to injected provider
  useEffect(() => {
    const init = async () => {
      try {
        const factory = new BondkitTokenFactory(base.id);
        factoryRef.current = factory;
        if (typeof window !== "undefined" && (window as any).ethereum) {
          await factory.connectWithProvider((window as any).ethereum);
        } else {
          factory.connect();
        }
      } catch (e) {
        console.error("Failed to init BondkitTokenFactory", e);
      }
    };
    init();
  }, []);

  const [activeTokenAddress, setActiveTokenAddress] = useState<`0x${string}` | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Keep track of raw input values for decimal fields
  const [rawInputs, setRawInputs] = useState({
    targetEth: "0.0000001",
    finalTokenSupply: "100000000000",
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
        migrationAdminAddress: address as `0x${string}`,
      }));
    }
  }, [address]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryRef.current) return;
    setIsPending(true);
    try {
      const tokenAddress = await factoryRef.current.deployBondkitToken(config as any);
      if (tokenAddress) {
        setActiveTokenAddress(tokenAddress as `0x${string}`);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Deploy failed", err);
    } finally {
      setIsPending(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setActiveTokenAddress(null);
  };

  const handleInputChange = (field: keyof BondkitTokenConfig, value: string) => {
    setConfig(prev => {
      const newConfig = { ...prev };

      switch (field) {
        case "name":
        case "symbol":
          newConfig[field] = value;
          break;
        case "feeRecipient":
        case "migrationAdminAddress":
          // Ensure addresses are valid hex
          if (value.startsWith("0x") && value.length === 42) {
            newConfig[field] = value as `0x${string}`;
          }
          break;
        case "targetEth":
          // Handle decimal input for ETH
          setRawInputs(prev => ({ ...prev, targetEth: value }));
          if (value && !isNaN(Number(value))) {
            try {
              newConfig.targetEth = parseEther(value);
            } catch {}
          }
          break;
        case "finalTokenSupply":
          // Handle decimal input for token supply
          setRawInputs(prev => ({ ...prev, finalTokenSupply: value }));
          if (value && !isNaN(Number(value))) {
            try {
              newConfig.finalTokenSupply = parseEther(value);
            } catch {}
          }
          break;
        case "aggressivenessFactor":
          const factor = Number(value);
          if (!isNaN(factor) && factor >= 1 && factor <= 100) {
            newConfig.aggressivenessFactor = factor;
          }
          break;
        case "lpSplitRatioFeeRecipientBps":
          const bps = Number(value);
          if (!isNaN(bps) && bps >= 0 && bps <= 10000) {
            newConfig.lpSplitRatioFeeRecipientBps = BigInt(bps);
          }
          break;
      }

      return newConfig;
    });
  };

  const applyTemplate = (template: (typeof presetTemplates)[0]) => {
    setConfig(prev => ({
      ...prev,
      ...template.config,
    }));
    setRawInputs({
      targetEth: formatEther(template.config.targetEth || BigInt(0)),
      finalTokenSupply: formatEther(template.config.finalTokenSupply),
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Success Modal */}
      {showSuccessModal && activeTokenAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-md rounded-lg bg-gray-800 p-6 text-center">
            <div className="mb-4 text-4xl">🎉</div>
            <h2 className="mb-2 text-2xl font-bold">Token Deployed!</h2>
            <p className="mb-4 text-gray-400">Your token has been successfully deployed</p>
            <div className="mb-4 break-all rounded bg-gray-700 p-3 font-mono text-sm">{activeTokenAddress}</div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/token/${activeTokenAddress}`)}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                View Token
              </button>
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-lg bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Deploy Bondkit Token</h1>
              <p className="mt-2 text-gray-400">Create your token with a customizable bonding curve</p>
            </div>
            <SignInWithB3OnBase />
          </div>
        </div>

        {/* Template Selection */}
        <div className="mb-8 rounded-lg bg-gray-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Quick Start Templates</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {presetTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => applyTemplate(template)}
                className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-left transition-all hover:border-blue-500 hover:bg-gray-800"
              >
                <div className="font-semibold">{template.name}</div>
                <div className="mt-1 text-sm text-gray-400">{template.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleDeploy} className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Basic Configuration</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Token Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={e => handleInputChange("name", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Token Symbol</label>
                <input
                  type="text"
                  value={config.symbol}
                  onChange={e => handleInputChange("symbol", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Final Token Supply</label>
                <input
                  type="text"
                  value={rawInputs.finalTokenSupply}
                  onChange={e => handleInputChange("finalTokenSupply", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Target ETH</label>
                <input
                  type="text"
                  value={rawInputs.targetEth}
                  onChange={e => handleInputChange("targetEth", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Aggressiveness Factor (1-100)</label>
                <input
                  type="number"
                  value={config.aggressivenessFactor}
                  onChange={e => handleInputChange("aggressivenessFactor", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white"
                  min="1"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">LP Split Ratio (BPS)</label>
                <input
                  type="number"
                  value={config.lpSplitRatioFeeRecipientBps?.toString()}
                  onChange={e => handleInputChange("lpSplitRatioFeeRecipientBps", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white"
                  min="0"
                  max="10000"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Advanced Settings</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Fee Recipient Address</label>
                <input
                  type="text"
                  value={config.feeRecipient}
                  onChange={e => handleInputChange("feeRecipient", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Migration Admin Address</label>
                <input
                  type="text"
                  value={config.migrationAdminAddress}
                  onChange={e => handleInputChange("migrationAdminAddress", e.target.value)}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 font-mono text-sm text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!isConnected || isPending}
              className={cn(
                "flex-1 rounded-lg px-6 py-3 font-semibold transition-colors",
                isConnected && !isPending
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-gray-600 text-gray-400",
              )}
            >
              {isPending ? "Deploying..." : isConfirming ? "Confirming..." : "Deploy Token"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>

        {hash && (
          <div className="mt-6 rounded-lg bg-blue-900/20 p-4">
            <p className="text-sm text-blue-300">Transaction Hash:</p>
            <p className="font-mono text-xs">{hash}</p>
          </div>
        )}
      </div>
    </div>
  );
}
